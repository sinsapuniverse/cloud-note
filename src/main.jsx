import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const PASSWORD_KEY = "cloud-note-password";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkdown(markdown) {
  return escapeHtml(markdown || "")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}

function cleanNotePath(name) {
  const cleaned = name
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.md$/i, "")
    .replace(/[^\wก-๙ ./-]/g, "")
    .replace(/\s+/g, "-");

  if (!cleaned) return "";
  return `${cleaned.includes("/") ? cleaned : `notes/${cleaned}`}.md`;
}

async function api(name, options = {}) {
  const password = localStorage.getItem(PASSWORD_KEY) || "";
  const response = await fetch(`/.netlify/functions/${name}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-cloud-note-password": password,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function App() {
  const [repo, setRepo] = React.useState({ fullName: "Configure Netlify repo", branch: "main" });
  const [files, setFiles] = React.useState([]);
  const [filter, setFilter] = React.useState("");
  const [path, setPath] = React.useState("");
  const [content, setContent] = React.useState("");
  const [saved, setSaved] = React.useState("");
  const [sha, setSha] = React.useState(null);
  const [status, setStatus] = React.useState("ready");
  const [message, setMessage] = React.useState("Ready");
  const [password, setPassword] = React.useState(localStorage.getItem(PASSWORD_KEY) || "");
  const dirty = content !== saved;

  async function pullLatest() {
    setStatus("loading");
    setMessage("Pulling latest from GitHub...");
    try {
      const data = await api("list-files");
      setRepo(data.repo || repo);
      setFiles(data.files || []);
      setStatus("ready");
      setMessage(`Loaded ${data.files?.length || 0} Markdown files from ${data.repo?.fullName || "repo"}`);
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  async function openFile(filePath) {
    setStatus("loading");
    setMessage(`Opening ${filePath}...`);
    try {
      const data = await api(`get-file?path=${encodeURIComponent(filePath)}`);
      setPath(data.path);
      setContent(data.content || "");
      setSaved(data.content || "");
      setSha(data.sha || null);
      setStatus("ready");
      setMessage(`Opened ${data.path}`);
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  async function saveFile() {
    if (!path || !dirty) return;
    setStatus("saving");
    setMessage("Auto committing...");
    try {
      const data = await api("save-file", {
        method: "POST",
        body: JSON.stringify({ path, content, sha }),
      });
      setSha(data.sha);
      setSaved(content);
      setStatus("synced");
      setMessage(`Synced ${data.commitSha ? data.commitSha.slice(0, 7) : ""}`);
      pullLatest();
    } catch (error) {
      setStatus(error.status === 409 ? "conflict" : "error");
      setMessage(error.message);
    }
  }

  React.useEffect(() => {
    pullLatest();
  }, []);

  React.useEffect(() => {
    if (!path || !dirty) return;
    setStatus("editing");
    setMessage("Waiting to autosave...");
    const id = window.setTimeout(saveFile, 1500);
    return () => window.clearTimeout(id);
  }, [content, path]);

  function newNote() {
    const name = window.prompt("New note name");
    if (!name) return;
    const nextPath = cleanNotePath(name);
    if (!nextPath) return;
    const title = nextPath.split("/").pop().replace(/\.md$/i, "").replaceAll("-", " ");
    setPath(nextPath);
    setContent(`# ${title}\n\n`);
    setSaved("");
    setSha(null);
    setMessage("New note will autosave to GitHub");
  }

  function unlock() {
    localStorage.setItem(PASSWORD_KEY, password);
    pullLatest();
  }

  const visibleFiles = files.filter((file) => file.path.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <div className="logo">CN</div>
          <div>
            <strong>Cloud Note</strong>
            <small>{repo.fullName} · {repo.branch}</small>
          </div>
        </div>

        <div className="password">
          <input
            type="password"
            value={password}
            placeholder="App password, if enabled"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button onClick={unlock}>Unlock</button>
        </div>

        <div className="actions">
          <button onClick={newNote}>New note</button>
          <button onClick={pullLatest}>Pull latest</button>
        </div>

        <input
          className="search"
          value={filter}
          placeholder="Search files..."
          onChange={(event) => setFilter(event.target.value)}
        />

        <nav>
          {visibleFiles.map((file) => (
            <button
              key={file.path}
              className={file.path === path ? "active" : ""}
              onClick={() => openFile(file.path)}
            >
              {file.path}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <header>
          <div>
            <h1>{path || "Select or create a note"}</h1>
            <p>{message}</p>
          </div>
          <div className={`pill ${status}`}>{status}</div>
          <button disabled={!path || !dirty} onClick={saveFile}>Save now</button>
        </header>

        {status === "conflict" && (
          <div className="warning">GitHub has a newer version. Pull latest before saving again.</div>
        )}

        <section className="editor">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="# Start writing..."
            spellCheck="false"
          />
          <article dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "# Preview") }} />
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
