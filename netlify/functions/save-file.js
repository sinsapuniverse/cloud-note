import { BRANCH, OWNER, REPO, assertPassword, encodePath, githubFetch, handleError, json, validatePath } from "./_github.js";

async function getCurrentSha(path) {
  try {
    const file = await githubFetch(`/repos/${OWNER}/${REPO}/contents/${encodePath(path)}?ref=${encodeURIComponent(BRANCH)}`);
    return file.sha;
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

export async function handler(event) {
  try {
    assertPassword(event);

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed." });
    }

    const body = JSON.parse(event.body || "{}");
    const path = validatePath(body.path);
    const content = typeof body.content === "string" ? body.content : "";
    const clientSha = body.sha || null;
    const currentSha = await getCurrentSha(path);

    if (currentSha && clientSha && currentSha !== clientSha) {
      return json(409, {
        error: "Conflict: GitHub has a newer version of this file.",
        currentSha,
      });
    }

    const result = await githubFetch(`/repos/${OWNER}/${REPO}/contents/${encodePath(path)}`, {
      method: "PUT",
      body: {
        message: currentSha ? `cloud-note: update ${path}` : `cloud-note: create ${path}`,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch: BRANCH,
        ...(currentSha ? { sha: currentSha } : {}),
      },
    });

    return json(200, {
      path,
      sha: result.content?.sha,
      commitSha: result.commit?.sha,
    });
  } catch (error) {
    return handleError(error);
  }
}
