import { BRANCH, OWNER, REPO, assertPassword, githubFetch, handleError, json } from "./_github.js";

export async function handler(event) {
  try {
    assertPassword(event);

    const tree = await githubFetch(`/repos/${OWNER}/${REPO}/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`);
    const files = (tree.tree || [])
      .filter((item) => item.type === "blob" && /\.(md|markdown)$/i.test(item.path))
      .map((item) => ({
        path: item.path,
        name: item.path.split("/").pop(),
        sha: item.sha,
        size: item.size || 0,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));

    return json(200, {
      repo: { fullName: `${OWNER}/${REPO}`, branch: BRANCH },
      files,
    });
  } catch (error) {
    return handleError(error);
  }
}
