# michael tarekegn · personal site

Static site, no build step. Deployed to GitHub Pages from `main` at
https://michaeltarekegn.com.

| File | Purpose |
|---|---|
| `index.html` | Home: intro, about, collapsible timeline and awards, selected research, projects |
| `projects.html` | Full list of research, experience and projects |
| `resume.pdf` | Resume, linked from the nav and the home page |
| `paper-*.html`, `project-*.html` | Detail pages |
| `style.css` | All styles, light and dark themes |
| `site.js` | Theme toggle, animated folds |
| `home.html`, `awards.html`, `connect.html` | Redirect stubs so old shared links still resolve |

After editing CSS or JS, bump the `?v=` query on the `style.css` and `site.js`
links so browsers fetch the new copy.

## Local preview

    python -m http.server 8940
