# Publishing These Docs

This documentation site is built with **VitePress** and can be published to
**GitHub Pages** so you have a live, citable URL for your thesis.

## Run locally

```bash
pnpm docs:dev      # dev server with hot reload
pnpm docs:build    # build the static site to docs/.vitepress/dist
pnpm docs:preview  # preview the built site
```

## Automatic deployment (GitHub Actions)

A workflow at `.github/workflows/deploy-docs.yml` builds and deploys the site
whenever you push changes to `docs/` on the default branch.

**One-time setup:**

1. Push the workflow to GitHub (it's included in this repo).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to the default branch (or re-run the workflow). The site deploys
   automatically.

Once deployed, the site is available at:

```
https://haruhadj.github.io/secure-qr-attendance/
```

::: info The `base` path
Because this is a **project** Pages site (served under `/secure-qr-attendance/`),
the VitePress config sets `base: '/secure-qr-attendance/'`. If you fork or rename
the repo, update `base` in `docs/.vitepress/config.ts` to match the new repo name,
or the CSS/JS assets won't load.
:::

## The workflow

```yaml
name: Deploy Docs to GitHub Pages
on:
  push:
    branches: [main]
    paths: ['docs/**', '.github/workflows/deploy-docs.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm docs:build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Alternative hosts

The built output in `docs/.vitepress/dist` is a plain static site. You can host
it anywhere static (Netlify, Cloudflare Pages, Vercel static, an S3 bucket). If
the host serves from the domain root, set `base: '/'` in the config instead.
