# Domains, DNS and HTTPS

Internal ops notes. Excluded from the build in `_config.yml` — this file is not
published. Verified against GitHub Docs, Cloudflare Docs and live DNS on
2026-09-04.

**Target state:** `pouya.ai` is the canonical site, served by GitHub Pages.
`ghrmn.com` 301-redirects to it, preserving the path.

---

## 0. Where things stand

| | |
| --- | --- |
| `pouya.ai` | Registered 2026-09-04 via **Cloudflare Registrar**. NS `dara`/`nile.ns.cloudflare.com`. Zone is live and authoritative but **empty**. |
| `ghrmn.com` | GoDaddy NS (`ns59`/`ns60.domaincontrol.com`), A records → GitHub Pages, `www` CNAME → `pouyaghahramanian.github.io`. HTTPS enforced. **No MX, TXT or CAA records** — so moving nameservers carries no email risk. |
| GitHub Pages | `build_type: workflow` (Actions). Custom domain still `ghrmn.com`. |

---

## 1. Two facts that decide everything below

### The `CNAME` file is inert under Actions publishing

> "If you are publishing your site from a branch, this will create a commit that
> adds a `CNAME` file directly to the root of your source branch. **If you are
> publishing from a custom GitHub Actions workflow, no CNAME file is created,
> and any existing CNAME file is ignored and is not required.**"
> — [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

**The Settings → Pages value is authoritative.** The old worry that a static-site
build force-pushes over `CNAME` and drops your domain applies to *branch*
publishing only. We keep the file in sync anyway: it costs one line and is the
only protection if the publishing source is ever switched back to a branch.

### Proxying breaks GitHub's certificate issuance — and the reason is not ACME

GitHub runs an automatic DNS check when you set a custom domain, and only queues
the Let's Encrypt request if that check passes:

> "an HTTPS certificate will not be able to be generated due to the DNS
> configuration … This can be caused by extra DNS records, or **records not
> pointing to the IP addresses for GitHub Pages**."

With the orange cloud on, `dig pouya.ai A` returns *Cloudflare anycast IPs*, not
`185.199.x.x`. GitHub's check fails, and no certificate is ever requested. The
ACME challenge is never even reached.

Separately, proxying with SSL/TLS mode **Flexible** produces an infinite loop:

> "If your domain's encryption mode is set to **Flexible**, Cloudflare sends
> unencrypted requests to your origin server over HTTP. **Redirect loops will
> occur if your origin server automatically redirects all HTTP requests to
> HTTPS.**"
> — [ERR_TOO_MANY_REDIRECTS](https://developers.cloudflare.com/ssl/troubleshooting/too-many-redirects/) (page updated 2026-09-01)

With Enforce HTTPS on, GitHub Pages *is* that origin. Cloudflare names this case
for SaaS-hosted origins and gives the remedy: *"If your SaaS platform does not
explicitly support Cloudflare's proxy, set the record to DNS-only."*

**So: `pouya.ai` is DNS-only. `ghrmn.com` is proxied** — because Redirect Rules
require proxied traffic, and by then it has no GitHub origin left to loop against.

Proxying `pouya.ai` would buy nothing anyway: GitHub Pages already serves from a
global CDN with a free auto-renewing certificate.

---

## 2. DNS records for pouya.ai

All **DNS only** (grey cloud). Delete any Cloudflare-seeded placeholder records
at `@` or `www` first — GitHub warns that extra records at those names *"may
prevent the HTTPS certificate from generating."*

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| AAAA | `@` | `2606:50c0:8000::153` | DNS only |
| AAAA | `@` | `2606:50c0:8001::153` | DNS only |
| AAAA | `@` | `2606:50c0:8002::153` | DNS only |
| AAAA | `@` | `2606:50c0:8003::153` | DNS only |
| CNAME | `www` | `pouyaghahramanian.github.io` | DNS only |

A CNAME at the apex relying on Cloudflare's flattening would also work and would
auto-track future GitHub IP changes, but neither vendor documents the pairing,
and a dangling target returns NODATA rather than failing loudly. The literal
record set from GitHub's own table is the lower-risk choice.

---

## 3. Runbook

### Phase A — move ghrmn.com to Cloudflare (no downtime; site keeps working)

Do this **first**. Universal SSL for `ghrmn.com` must already be issued when the
cutover happens, or the redirect will throw certificate errors.

1. Add `ghrmn.com` to Cloudflare. Confirm the imported zone has exactly the four
   `A @` GitHub records and `CNAME www → pouyaghahramanian.github.io`, all
   **DNS-only**.
2. At GoDaddy, change nameservers to the two Cloudflare NS assigned to the zone.
3. Wait for the zone to read **Active** and Universal SSL to issue (usually
   minutes; Cloudflare allows up to 24 h).

Nothing changes for visitors here — GitHub Pages still serves `ghrmn.com`.

### Phase B — prepare pouya.ai

4. **Verify the domain at account level.** GitHub Settings → Pages → *Add a
   domain* → `pouya.ai` → add the `_github-pages-challenge-PouyaGhahramanian`
   TXT record in Cloudflare → Verify. This reserves the domain without touching
   the live custom domain, shrinking the cutover window. Keep the TXT record.
5. Add the nine records from §2, all DNS-only.
6. Confirm: `dig pouya.ai +short A`, `dig pouya.ai +short AAAA`,
   `dig www.pouya.ai +short` return GitHub's addresses.

### Phase C — cutover (the only window)

7. Repo → Settings → Pages → **Custom domain** → `pouya.ai` → Save.
8. **Immediately**, in the `ghrmn.com` zone: delete the four `A @` records and
   the `www` CNAME; add `A @ 192.0.2.1` and `A www 192.0.2.1`, both **Proxied**.
   (Optionally `AAAA @ 100::` and `AAAA www 100::`, also proxied.) `192.0.2.1` is
   Cloudflare's documented originless placeholder — nothing connects to it; it
   exists so rules have something to fire on.
9. Create the Redirect Rule (§4).
10. Merge and push the site. The Actions build publishes `pouya.ai` canonicals.

### Phase D — finish

11. Wait for the green tick next to `pouya.ai`, then tick **Enforce HTTPS** —
    it resets when the domain changes. If it stalls, Remove the custom domain,
    retype it and Save; that restarts provisioning. Allow up to an hour for
    HTTPS, up to 24 h for the checkbox to appear.
12. Verify:

    ```sh
    curl -sSI https://pouya.ai/              # 200, server: GitHub.com
    curl -sSI http://pouya.ai/               # 301 -> https://pouya.ai/
    curl -sSI https://www.pouya.ai/          # 301 -> https://pouya.ai/
    curl -sSI https://ghrmn.com/cv/          # 301 -> https://pouya.ai/cv/
    curl -sSI https://www.ghrmn.com/blog/    # 301 -> https://pouya.ai/blog/
    curl -sSI "https://ghrmn.com/x/?q=1"     # 301 -> https://pouya.ai/x/?q=1
    ```

13. Search Console (§5).
14. **Only now**, optionally enable DNSSEC on `pouya.ai`. `.ai` is a signed TLD;
    a DS mismatch mid-cutover is a hard outage, not a soft one.

---

## 4. The redirect rule

**Rules → Redirect Rules → Create rule**, custom filter expression:

- **When incoming requests match:**

  ```
  (http.host eq "ghrmn.com" or http.host eq "www.ghrmn.com")
  ```

- **Then → Type:** Dynamic
- **Expression:**

  ```
  concat("https://pouya.ai", http.request.uri.path)
  ```

- **Status code:** `301`
- **Preserve query string:** enabled

### Why not GoDaddy forwarding

Because it would collapse every deep URL to the root. GoDaddy's forwarding data
model is `fqdn` + `type` + `url` + `mask` — [there is no path, append or
preserve parameter](https://developer.godaddy.com/en/docs/api-users/domains/manage/forwarding),
so one FQDN maps to one fixed destination. `ghrmn.com/cv/` would land on
`pouya.ai/`, not `pouya.ai/cv/`. With `/cv/`, `/publications/` and the blog URLs
already indexed, that destroys the per-URL signal Google needs and breaks every
inbound deep link.

(GoDaddy's docs are *silent* on path preservation rather than confirming the
collapse — their help centre blocks automated fetches. But the documented schema
has no mechanism that could preserve a path, and their support forums carry
threads about exactly this. Not something to migrate on faith.)

---

## 5. What changes with the canonical hostname

Everything below flows from `url:` in `_config.yml`, since `jekyll-seo-tag`,
`jekyll-sitemap` and `jekyll-feed` all derive absolute URLs from it.

Already done in this repo: `_config.yml` `url`, `CNAME`, `robots.txt` sitemap
line, README title. Canonical tags, `og:url`, `sitemap.xml` and `feed.xml` all
follow automatically. No hardcoded absolute URLs exist in content — everything
uses `relative_url` / `absolute_url`.

Still to do by hand, off-repo: GitHub profile website field, repo About URL,
Google Scholar, ORCID, LinkedIn, Twitter/X bio, university page, email
signature, and the URL printed in `files/Pouya_Ghahramanian_cv.pdf`.

### Google Search Console

The [Change of Address tool](https://support.google.com/webmasters/answer/9370220)
covers exactly this case ("relocating your site between domains"). It requires:

- Both properties owned under the same account.
- **Domain-level properties**, not path-scoped. Cloudflare is DNS for both, so
  verify each as a Domain property with a TXT record — that covers apex, `www`
  and both schemes at once.
- 301s already live (Phase C).
- **Keep the redirects for at least 180 days** — realistically, renew
  `ghrmn.com` indefinitely.

Order: verify `pouya.ai` → submit `https://pouya.ai/sitemap.xml` → run Change of
Address from the `ghrmn.com` property → keep the old property to watch traffic
migrate.

Note this is the third canonical hostname for this site
(`github.io` → `ghrmn.com` → `pouya.ai`) and `ghrmn.com` has only weeks of index
history. Expect a ranking dip.

---

## 6. `.ai` specifics

- **Registry is Identity Digital**, not a bare Anguilla operation — modern
  infrastructure; the old `.ai` reliability folklore is out of date.
- **`.ai` is DNSSEC-signed** at the root. Cloudflare offers one-click DNSSEC;
  enable it only *after* Phase D.
- **`.ai` is NOT on the HSTS preload list** (unlike `.dev` and `.app`) —
  confirmed against `hstspreload.org`, which reports `ai` as `unknown`. So there
  is no automatic HTTPS-only enforcement: GitHub's 301 is the only protection,
  and the first plaintext request per browser is still exposed. GitHub Pages
  cannot set an HSTS header. Don't chase preload submission — it is effectively
  irreversible.
- **Two-year minimum term** at Cloudflare Registrar; expiry is 2028-09-04. Turn
  auto-renew on. Losing this domain after the migration would be far worse than
  losing `ghrmn.com` is now.
- **No certificate obstacles.** Neither domain has a CAA record, so nothing
  blocks issuance — but if you ever add one, it must include
  `letsencrypt.org`.

---

## Appendix: the original HTTPS fix (resolved 2026-09-04)

`https_enforced` was `false` while the certificate was already approved, so
`http://ghrmn.com` served plaintext with no redirect and
`https://pouyaghahramanian.github.io` actively downgraded to `http://`. Fixed by
ticking **Enforce HTTPS**; verified `301` on both. `_config.yml` had also
declared `url: https://PouyaGhahramanian.github.io` against a `ghrmn.com`
`CNAME`, splitting canonical URLs across two hosts that both served `200`.
