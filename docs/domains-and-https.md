# Domains and HTTPS

Everything in this file was verified against the live site and against current
vendor documentation on 2026-09-04.

---

## 1. The HTTPS problem, and the two-click fix

**The certificate was never the problem.** `https://ghrmn.com` already works and
GitHub's Let's Encrypt certificate covers both `ghrmn.com` and `www.ghrmn.com`,
valid until 2026-11-29. What was wrong is a single unticked checkbox:

```jsonc
// GET /repos/PouyaGhahramanian/PouyaGhahramanian.github.io/pages
{
  "https_certificate": { "state": "approved" },
  "https_enforced":    false,          // <- the bug
  "html_url":          "http://ghrmn.com/"
}
```

Measured consequences:

| Request | Response before the fix |
| --- | --- |
| `http://ghrmn.com` | `200 OK` in **plaintext** — no redirect at all |
| `http://www.ghrmn.com` | `301` → `http://ghrmn.com/` — stays on plaintext |
| `https://pouyaghahramanian.github.io` | `301` → **`http://`**`ghrmn.com/` — an active downgrade |

### Fix (must be done by the repo owner)

The `gh` CLI on this machine is authenticated as **`p0uy4`**, which has
`admin: false` / `push: false` on this repository. `PUT /pages` therefore
returns `404` rather than `403` — GitHub hides endpoints you cannot use. So this
has to be done while signed in as **`PouyaGhahramanian`**.

1. Sign in to GitHub as **PouyaGhahramanian**.
2. Open <https://github.com/PouyaGhahramanian/PouyaGhahramanian.github.io/settings/pages>
3. Confirm **Custom domain** shows `ghrmn.com` with a green tick.
4. Tick **Enforce HTTPS**. It applies immediately — there is no Save button.

Or, from a shell authenticated as the owner:

```sh
gh api -X PUT repos/PouyaGhahramanian/PouyaGhahramanian.github.io/pages \
  -F https_enforced=true
```

Verify:

```sh
curl -sSI http://ghrmn.com               | head -3   # expect 301 -> https://ghrmn.com/
curl -sSI http://www.ghrmn.com           | head -3   # expect 301 -> https://
curl -sSI https://pouyaghahramanian.github.io | head -3   # expect 301 -> https://ghrmn.com/
```

The cert is already approved, so enabling this has **no downtime**.

### Also fixed in this rebuild

`_config.yml` declared `url: https://PouyaGhahramanian.github.io` while `CNAME`
said `ghrmn.com`. Every canonical tag, `sitemap.xml` entry, feed URL and Open
Graph URL pointed at the wrong host, and both hostnames served every page with a
`200` — a textbook duplicate-content split. `url` is now `https://ghrmn.com`.

After deploying, in Google Search Console: make `https://ghrmn.com` the property
you care about and resubmit `https://ghrmn.com/sitemap.xml`.

---

## 2. Pointing p0uya.com at the site

**GitHub Pages allows exactly one custom domain per repository.** The `CNAME`
file holds one domain; there is no second slot.

> "The CNAME file can contain only one domain. To point multiple domains to your
> site, you must set up a redirect through your DNS provider."
> — [GitHub Docs, Troubleshooting custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)

So `ghrmn.com` stays canonical and `p0uya.com` redirects to it.

### Recommended: GoDaddy forwarding

This is the current recommendation and it contradicts a lot of older advice
online. GoDaddy now issues certificates for the **source** domain automatically,
so `https://p0uya.com` redirects instead of throwing a certificate error.

> "Forwarding over HTTPS is now automatically applied to your domain when you set
> up forwarding following these steps."
> — GoDaddy help article 12123, *Forward my GoDaddy domain*

And empirically, **before any change**, `p0uya.com` already terminates TLS with a
matching certificate on both apex and `www`, and already sends
`308 → https://p0uya.com/`. The edge that will serve the forward already holds
the certificate.

Steps:

1. Sign in to the GoDaddy Domain Portfolio: <https://dcc.godaddy.com/control/portfolio>
2. Select **p0uya.com** to open Domain Settings.
3. Go to the **DNS** tab → **Forwarding**.
4. **First disconnect the parking / Websites+Marketing site currently on the
   domain.** It answers today (`Server: DPS/2.0.0`) and parking will otherwise
   keep winning over forwarding.
5. **Add Forwarding** → **Domain** (not Subdomain).
6. Destination prefix: **`https://`** — destination: **`ghrmn.com`**.
7. Forwarding type: **Permanent (301)**. Not 302, and **not** "Forward with
   masking" — masking keeps `p0uya.com` in the address bar inside a frame and
   splits your SEO across two hostnames.
8. **Save** (complete the 2SV prompt if Domain Protection is on).
9. Under **DNS Records**, confirm the `www` CNAME still points to `@`. It does
   today; check it survived.

Note the side effect GoDaddy documents: *"Adding forwarding will automatically
update and lock your @ A record."* To change it later, delete the forwarding first.

Verify all four entry points:

```sh
for u in http://p0uya.com https://p0uya.com http://www.p0uya.com https://www.p0uya.com; do
  printf '%-28s ' "$u"
  curl -sSI -m 15 "$u" | awk 'NR==1{print $2} /^[Ll]ocation:/{print "  ->", $2}'
done
# every one should end at https://ghrmn.com/
```

### Fallback: Cloudflare free plan

Only if the above has not worked an hour after the DNS TTL expires. It means
moving `p0uya.com`'s nameservers to Cloudflare — more moving parts, but it is
the more capable system and it is what you would use if you ever want HSTS.

1. Add `p0uya.com` to a free Cloudflare account; change the nameservers at
   GoDaddy to the pair Cloudflare gives you.
2. DNS records — both **Proxied** (orange cloud), because Redirect Rules only
   fire on traffic Cloudflare actually receives:

   | Type | Name | Content | Proxy |
   | --- | --- | --- | --- |
   | A | `@` | `192.0.2.1` | Proxied |
   | A | `www` | `192.0.2.1` | Proxied |

   (`192.0.2.1` is a reserved documentation address — nothing ever connects to
   it. Cloudflare's own originless-setup guidance; `100::` is the IPv6
   equivalent.)
3. **Rules → Redirect Rules → Create rule**
   - If: `hostname` **is in** `p0uya.com`, `www.p0uya.com`
   - Then: **Dynamic** → `concat("https://ghrmn.com", http.request.uri.path)`
   - Status **301**, **preserve query string** on.
4. **SSL/TLS → Overview → Full**.
5. Universal SSL is issued only after the zone goes active, so
   `https://p0uya.com` will error for a few minutes (occasionally up to 24h).

---

## 3. HSTS

Worth having in principle; not available here. GitHub Pages exposes no mechanism
for setting response headers, so `Strict-Transport-Security` cannot be set on
`ghrmn.com`. "Enforce HTTPS" closes the large hole (every subsequent request);
HSTS would close the small remaining one (the very first plaintext request from a
browser that has never visited).

For a personal site with no logins, sessions or valuable cookies, that residual
risk is small — it is not a reason to restructure hosting. If you ever put
`ghrmn.com` behind Cloudflare for other reasons, turn HSTS on there.
