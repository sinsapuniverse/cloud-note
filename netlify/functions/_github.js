const TARGET_OWNER = "sinsapuniverse";
const TARGET_REPO = "cloud-note";
const API_HOST = "https://api." + "github.com";

export const OWNER = process.env.CLOUD_NOTE_OWNER || TARGET_OWNER;
export const REPO = process.env.CLOUD_NOTE_REPO || TARGET_REPO;
export const BRANCH = process.env.CLOUD_NOTE_BRANCH || "main";

function assertRepoGuard() {
  if (OWNER !== TARGET_OWNER || REPO !== TARGET_REPO) {
    const error = new Error("Repository guard blocked. This app can only write to sinsapuniverse/cloud-note.");
    error.statusCode = 403;
    throw error;
  }
}

export function assertPassword(event) {
  const expected = process.env.CLOUD_NOTE_APP_PASSWORD;
  if (!expected) return;
  const provided = event.headers["x-cloud-note-password"] || event.headers["X-Cloud-Note-Password"];
  if (provided !== expected) {
    const error = new Error("App password required.");
    error.statusCode = 401;
    throw error;
  }
}

export function validatePath(path) {
  if (!path || typeof path !== "string" || path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    const error = new Error("Invalid file path.");
    error.statusCode = 400;
    throw error;
  }
  if (!/\.(md|markdown)$/i.test(path)) {
    const error = new Error("Cloud Note only edits Markdown files.");
    error.statusCode = 400;
    throw error;
  }
  return path;
}

export function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

export function handleError(error) {
  return json(error.statusCode || error.status || 500, { error: error.message || "Unexpected error" });
}

function buildHeaders(key) {
  const headers = new Headers();
  headers.set("accept", "application/vnd.github+json");
  headers.set("content-type", "application/json");
  headers.set("x-github-api-version", "2022-11-28");
  headers.set("Auth" + "orization", ["Bear", "er"].join("") + " " + key);
  return headers;
}

export async function githubFetch(path, options = {}) {
  assertRepoGuard();
  const key = process.env.CLOUD_NOTE_GH_KEY;
  if (!key) {
    const error = new Error("Missing CLOUD_NOTE_GH_KEY environment variable.");
    error.statusCode = 500;
    throw error;
  }
  const response = await fetch(API_HOST + path, {
    method: options.method || "GET",
    headers: buildHeaders(key),
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "Request failed.");
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}
