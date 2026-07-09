---
name: "veo_pages_publish"
description: "Publishes VE-O frontend projects to GitHub and GitHub Pages. Invoke when a project uses @ve-o-design and the user asks to publish, update Pages, or reuse the VE-O release flow."
---

# VE-O Pages Publish

Use this skill when working on a frontend project that uses `@ve-o-design/web-react`, and the user wants us to:

- publish code to GitHub
- update GitHub Pages
- refresh an existing GitHub Pages deployment
- reuse the same release flow for another VE-O based project

This skill is optimized for Vite/React projects, especially when:

- the project uses `BrowserRouter`
- the repo is deployed under a GitHub Pages subpath
- `package-lock.json` points to `bnpm.byted.org`
- local shell `PATH` does not expose `node` / `npm`, but Homebrew Node still exists

## What this skill does

1. Verifies local git / remote / current branch state
2. Checks whether local `node` / `npm` are available, including fallback paths
3. Builds the project locally
4. Pushes source updates to GitHub `main`
5. Publishes `dist/` to `gh-pages`
6. Verifies that GitHub Pages has started serving the new bundle
7. Documents the release flow in `README.md` if needed

## Core rules

### 1. Prefer local build for VE-O projects

If `package-lock.json` contains tarballs from `bnpm.byted.org`, do **not** rely on GitHub Actions to install dependencies in the public runner by default.

Reason:

- GitHub-hosted runners often cannot resolve internal ByteDance package mirrors
- `npm install` or `npm ci` may fail before build even starts

In this situation, prefer:

1. build locally
2. push source to `main`
3. publish `dist/` directly to `gh-pages`

### 2. Check for hidden local Node before giving up

Even if `node` / `npm` are not in `PATH`, check these locations first:

```bash
ls -l /opt/homebrew/bin/node /opt/homebrew/bin/npm /usr/local/bin/node /usr/local/bin/npm 2>/dev/null || true
find /Applications -maxdepth 5 -name node -type f 2>/dev/null | sed -n '1,40p'
```

If Homebrew Node exists, run commands with:

```bash
PATH=/opt/homebrew/bin:$PATH npm run build
```

### 3. Keep GitHub Pages subpath correct

For GitHub Pages hosted at:

```text
https://<user>.github.io/<repo>/
```

make sure:

- `vite.config.ts` production `base` is `/<repo>/`
- `BrowserRouter` uses `basename={import.meta.env.BASE_URL}`

Otherwise the page may render blank even though static assets load correctly.

## Standard workflow

### Step 1. Check repository state

Run:

```bash
git -c core.quotepath=false status --short
git remote -v
git log --oneline -n 5
git ls-remote --heads origin main gh-pages
```

Notes:

- do not accidentally commit unrelated untracked files
- if only certain files are needed for release, stage those explicitly

### Step 2. Verify build prerequisites

Run:

```bash
PATH=/opt/homebrew/bin:$PATH node --version
PATH=/opt/homebrew/bin:$PATH npm --version
```

If those fail, inspect fallback paths before changing deployment strategy.

### Step 3. Build locally

Run:

```bash
PATH=/opt/homebrew/bin:$PATH npm run build
```

If build fails, fix code first before publishing.

### Step 4. Push source changes to GitHub

Stage only intended files:

```bash
git add <files>
git commit -m "<commit message>"
git push origin main
```

If there are unrelated untracked files, leave them alone.

### Step 5. Publish `dist/` to `gh-pages`

Use a temp directory so the workspace stays clean:

```bash
tmpdir=$(mktemp -d /tmp/veo-pages.XXXXXX) && \
rsync -a dist/ "$tmpdir"/ && \
touch "$tmpdir"/.nojekyll && \
cd "$tmpdir" && \
git init -b gh-pages && \
git config user.name "<github-name>" && \
git config user.email "<github-email>" && \
git add . && \
git commit -m "Deploy GitHub Pages" && \
git remote add origin https://github.com/<owner>/<repo>.git && \
git push -f origin gh-pages
```

### Step 6. Verify remote updated

Check `gh-pages` head:

```bash
git ls-remote --heads origin gh-pages
```

Then verify served HTML:

```bash
curl -s https://<user>.github.io/<repo>/ | rg "<repo>/assets|index-"
curl -I -s https://<user>.github.io/<repo>/
```

Important:

- GitHub Pages may still return cached HTML for a short time
- if `gh-pages` has updated but the page still serves the old bundle, wait and recheck
- tell the user to hard refresh if needed

## When GitHub Actions should be avoided

Avoid adding or relying on GitHub Actions for deployment when all of the following are true:

- the lockfile resolves packages from `bnpm.byted.org`
- the public GitHub runner cannot access those packages
- local build already works

In that case, Actions usually adds noise and slows down release.

## When GitHub Actions can be used

GitHub Actions is acceptable only if:

- dependencies resolve from public registries, or
- the repo has working authenticated registry setup for CI

If you do create a workflow, verify it does not become the new bottleneck.

## README guidance

If the repo has no release documentation, update `README.md` with:

- GitHub repo URL
- GitHub Pages URL
- local build command
- current deployment method
- GitHub Pages subpath notes for Vite + Router

Keep README aligned with the real deployment strategy. Do not document Actions if the real flow is manual `gh-pages` publishing.

## Output expectations

When finishing, report:

1. source commit pushed to `main`
2. deploy commit pushed to `gh-pages`
3. current Pages URL
4. whether CDN cache is still serving old HTML
5. any manual refresh advice the user should know
