# AI Knowledge Brain Workflow

## Goal

Keep knowledge in Markdown files so humans can edit it easily and AI agents can read it reliably.

## Flow

1. User opens Cloud Note.
2. App pulls latest files from GitHub.
3. User edits Markdown.
4. App autosaves.
5. Netlify Function commits the change to GitHub.
6. GitHub becomes the source of truth.
7. AI agents can read the repo as project memory.

## Safety

- Keep GitHub token server-side only.
- Use conflict detection before writing.
- Show simple sync states to the user.
- Use Git history for recovery.
