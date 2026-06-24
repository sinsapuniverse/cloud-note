# Cloud Note

Cloud Note is an Obsidian-like Markdown note app backed by this GitHub repository.

The user-facing experience is simple:

```text
open file -> edit -> autosave -> synced
```

Behind the scenes, the app uses Netlify Functions to read and write files in `sinsapuniverse/cloud-note`. The GitHub token stays on the server side and is never exposed to the browser.

## Features

- File explorer for Markdown notes
- Markdown editor and preview
- Pull latest from GitHub on refresh/open
- Autosave with automatic GitHub commits
- Manual save button
- Basic conflict protection using GitHub file SHA
- Optional app password for write protection
- Repository guard: this code is hard-wired to `sinsapuniverse/cloud-note`

## Deploy to Netlify

1. Import this repo into Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Functions directory: `netlify/functions`
5. Add environment variables:

```bash
GITHUB_TOKEN=your_fine_grained_token_with_contents_read_write
CLOUD_NOTE_OWNER=sinsapuniverse
CLOUD_NOTE_REPO=cloud-note
CLOUD_NOTE_BRANCH=main
CLOUD_NOTE_APP_PASSWORD=optional_password_for_the_web_app
```

## GitHub token permissions

Use a fine-grained GitHub token or GitHub App installation token with access only to this repository.

Required permission:

```text
Repository contents: Read and write
```

Recommended: grant the token access to `sinsapuniverse/cloud-note` only.

## Local development

```bash
npm install
npm run dev
```

For local Netlify Functions, use Netlify CLI:

```bash
netlify dev
```

## Repository structure

```text
notes/          Markdown notes
workflows/      Workflow documents
agents/         Agent instructions or memory docs
.cloudnote/     App configuration
src/            Frontend app
netlify/        Serverless functions
```

## Safety note

This app intentionally hides Git from the user interface, but it still writes commits to GitHub. The UI shows sync status, conflicts, and save state so changes can be traced and restored from Git history.
