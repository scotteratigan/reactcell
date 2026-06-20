# ReactCell

A polished, fully-accessible **FreeCell solitaire** built from scratch in React 19 + TypeScript — no game libraries, no UI framework, zero runtime dependencies beyond React itself.

**▶︎ Play it live: [scotteratigan.github.io/reactcell](https://scotteratigan.github.io/reactcell/)**

## Highlights

### Accessibility

- **Fully keyboard-playable** — focus a card, press Enter/Space to select, focus a destination and confirm. Focus follows the card to its new home after every move.
- **Screen-reader first** — live-region move announcements, descriptive `aria-label`s ("Move 7♠ to foundation 1"), `aria-pressed` selection state, labelled landmark regions, and buried cards kept out of the tab order.
- **Zero axe-core violations**, enforced by an automated accessibility test on every run.
- **Respects `prefers-reduced-motion`** — animations gracefully disable.

### Responsive design

- Fluid layout driven by CSS `clamp()` and viewport units — card size, gaps, radii, and type all scale smoothly from phone to desktop with no breakpoint jank.
- Built with plain CSS Modules (scoped styles, no CSS-in-JS runtime cost).

### Real game engine

- Complete FreeCell rules, including correct **multi-card run moves** bounded by the `(free cells + 1) × 2^empty columns` formula.
- **Drag-and-drop, click-to-move, keyboard, and double-click-to-send-home** all share one reducer.
- **One-click endgame auto-complete**, full **undo back to the deal**, and a satisfying win celebration.
- **Deterministic seeded deals**: every game has a shareable game number (copy to clipboard or share via URL) so two people can play the exact same deal.
- **Auto-save & resume** via `localStorage`, with schema versioning and strict validation that discards corrupt or finished saves.

### Testing & quality

- **Unit tests (Vitest)** covering the game engine, reducer, persistence, seeding, and components.
- **End-to-end tests (Playwright)** for drag-and-drop, multi-card sequences, persistence, seeding, keyboard play, and accessibility.
- **CI on every push** runs formatting, lint, type-check, unit tests, and a production build.
- Strict TypeScript, oxlint + oxfmt, and pre-commit hooks keep the codebase clean.

## Tech stack

React 19 · TypeScript · Vite · CSS Modules · Vitest · Playwright · oxlint/oxfmt · GitHub Actions

## Running locally

```bash
npm install
npm start        # Vite dev server at http://localhost:5173
```

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm start`         | Start the dev server.              |
| `npm run build`     | Production build into `dist/`.     |
| `npm test`          | Run unit tests (Vitest).           |
| `npm run test:e2e`  | Run end-to-end tests (Playwright). |
| `npm run typecheck` | Type-check the project.            |
| `npm run lint`      | Lint with oxlint.                  |

## Deployment

Every push to `main` triggers a GitHub Actions workflow that builds the app and publishes `dist/` to GitHub Pages — no manual steps. The Vite `base` is set to `/reactcell/` so assets resolve correctly under the project subpath.
