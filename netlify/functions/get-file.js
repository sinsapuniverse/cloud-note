import { BRANCH, OWNER, REPO, assertPassword, encodePath, githubFetch, handleError, json, validatePath } from "./_github.js";

export async function handler(event) {
  try {
    assertPassword(event);

    const path = validatePath(event.queryStringParameters?.path);
    const file = await githubFetch(`/repos/${OWNER}/${REPO}/contents/${encodePath(path)}?ref=${encodeURIComponent(BRANCH)}`);

    return json(200, {
      path: file.path,
      name: file.name,
      sha: file.sha,
      content: Buffer.from(file.content || "", "base64").toString("utf8"),
      size: file.size,
    });
  } catch (error) {
    return handleError(error);
  }
}
