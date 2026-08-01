# michael tarekegn — portfolio

Static personal site. No build step, no dependencies — plain HTML, one stylesheet,
one script. Deployed to GitHub Pages from `main`.

**Live:** https://michae6345-crypto.github.io

## Structure

| File | Purpose |
|---|---|
| `index.html` | Landing page ("[ enter ]" animation) |
| `home.html` | About |
| `projects.html` | Experience + projects index |
| `connect.html` | Email + social links |
| `project-{1,2,3,5,6,8}.html` | Detail pages |
| `minimal.css` | Shared stylesheet |
| `image-slot.js` | `<image-slot>` custom element for project images |
| `favicon.svg` | Favicon |

Project numbering skips 4 and 7 — those entries were removed.

## Local preview

    python -m http.server 8940

Then open http://localhost:8940 . Use a server, not `file://` — `image-slot.js`
fetches over HTTP.

## Images

`image-slot.js` reads image data from a sidecar file, `.image-slots.state.json`,
which is **not currently present**. Until it is, unfilled frames collapse
(see the empty-slot rules at the bottom of `minimal.css`) so detail pages render
as text only rather than showing empty placeholder boxes. Adding the sidecar
makes the frames appear again with no markup change.

Note that drag-and-drop editing only works in the original authoring environment
(it writes via `window.omelette.writeFile`). On GitHub Pages the slots are
read-only. For a long-lived static site, plain `<img>` tags are the more robust
option.

`.nojekyll` is present specifically so GitHub Pages does not strip dotfiles —
without it, `.image-slots.state.json` would never be served.

## Not deployed

`.gitignore` excludes authoring leftovers. In particular the bundled
`Michael Portfolio - Projects.html` still contains removed entries, so it must
not be served.
