# ReactCell

A FreeCell-style solitaire game built with React 19 and Vite. Play it live at
**[scotteratigan.github.io/reactcell](https://scotteratigan.github.io/reactcell/)**.

## Getting started

```bash
npm install
npm start
```

`npm start` runs the Vite dev server (default http://localhost:5173) with hot
module reloading.

## Scripts

| Command              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `npm start`          | Start the Vite dev server.                     |
| `npm run build`      | Build the production bundle into `dist/`.      |
| `npm run preview`    | Serve the production build locally.            |
| `npm test`           | Run unit tests once (Vitest).                  |
| `npm run test:watch` | Run unit tests in watch mode.                  |
| `npm run test:e2e`   | Run end-to-end tests (Playwright).             |
| `npm run typecheck`  | Type-check with the TypeScript native preview. |
| `npm run lint`       | Lint with oxlint.                              |
| `npm run format`     | Format with oxfmt and ruff.                    |

## Deployment

Deployment is fully automated with GitHub Actions. Every push to `main` runs
`.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to
GitHub Pages. No manual steps are required — just merge to `main`.

The Vite `base` is set to `/reactcell/` in `vite.config.ts` so that asset URLs
resolve correctly under the project's GitHub Pages subpath.
