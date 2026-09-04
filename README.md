# pouya.ai

Personal site of Pouya Ghahramanian — PhD researcher in machine learning for
data streams (Bilkent University, BilIR) and data scientist at Invent.ai.

Jekyll 4, hand-written SCSS, no framework and no JS dependencies.

---

## Running it locally

Requires Ruby 3.1+ (this repo was developed against the Homebrew Ruby).

```sh
bundle install
bundle exec jekyll serve --livereload
# http://127.0.0.1:4000
```

Build and check for broken internal links exactly as CI does:

```sh
bundle exec jekyll build
bundle exec ruby scripts/check_links.rb
```

## Deployment

Pushing to `master` triggers [`.github/workflows/pages.yml`](.github/workflows/pages.yml),
which builds with the pinned Jekyll from the `Gemfile`, runs the link check, and
deploys to GitHub Pages. Local and production therefore run identical versions —
which the legacy `github-pages` metagem could not offer.

> **One-time setting:** this requires **Settings → Pages → Build and deployment
> → Source = GitHub Actions**. Until that is switched, GitHub keeps using the
> legacy branch build and this workflow's deploy step will fail while the live
> site stays up.

See [`docs/domains-and-https.md`](docs/domains-and-https.md) for the domain, DNS
and HTTPS setup — the Cloudflare record set, why `pouya.ai` must stay DNS-only,
and the `ghrmn.com` redirect runbook. That file is excluded from the build.

## Where the content lives

Content is data, not markup. Editing these files is all that routine updates need:

| Path | Holds |
| --- | --- |
| `_data/experience.yml` | Roles, dates, bullet points |
| `_data/education.yml` | Degrees, theses, advisors |
| `_data/skills.yml` | Technical skills, grouped |
| `_data/awards.yml`, `_data/service.yml`, `_data/languages.yml` | CV tail sections |
| `_publications/*.md` | One file per paper — venue, authors, links, `result:` line |
| `_pages/about.md` | Homepage hero, research threads, headline metrics |
| `_pages/research.md` | The long-form research narrative |
| `_posts/` | Writing |
| `files/Pouya_Ghahramanian_cv.pdf` | The downloadable CV |

`/experience/`, `/cv/` and the publication lists are all generated from the same
data, so a fact is only ever written once.

### Adding a publication

Create `_publications/<handle>.md`:

```yaml
---
title: "Full paper title"
handle: "ShortName"          # what the field remembers it as
authors: "**Ghahramanian, P.**, & Can, F."   # bold your own name
year: 2026
date: 2026-01-01             # sorts the list
venue_short: "ACM CIKM"
venue_full: "ACM International Conference on Information and Knowledge Management"
status: "published"          # or "under_review"
featured: true               # surfaces it on the homepage
result: "ACCURACY +8.8% · 13 DATASETS"   # the mono line: the number, pulled forward
excerpt: "One sentence on what the paper does."
links:
  doi: "https://dl.acm.org/doi/..."
  code: "https://github.com/..."
---

Body copy, shown on the paper's own page.
```

## Design

Light-first: warm press paper by day, near-black sky by dark. The accent pair —
burnt ochre and petrol blue — is sampled from the portrait on the homepage, so
the photograph sits in the page rather than on it. Ochre is the only interactive
colour; petrol is never a link.

Two typefaces and no sans-serif: **Newsreader** carries every idea, **IBM Plex
Mono** carries every piece of apparatus (nav, years, venues, labels, metrics).

The one ornament is the drift trace — a reference signal and an adapted signal
diverging at a labelled change point. It is a picture of the thing the research
is actually about, which is why it is allowed to repeat.

Every text colour clears WCAG AA on every surface it is allowed to sit on
(lowest 4.53:1); every non-text boundary clears 3:1. Links never rely on hue
alone, motion respects `prefers-reduced-motion`, and there is a real print
stylesheet.

```
_sass/_tokens.scss      colours, type scale, spacing — both themes
_sass/_base.scss        typography and document furniture
_sass/_layout.scss      wrap, masthead, colophon
_sass/_components.scss  bibliography, timeline, stats, chips
_sass/_prose.scss       long-form content and the CV sheet
_sass/_home.scss        hero, portrait plate, drift trace
_sass/_print.scss       print
```

## Licence

Site content © Pouya Ghahramanian. Code under [MIT](LICENSE).
