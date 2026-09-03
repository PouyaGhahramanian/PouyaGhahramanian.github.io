source "https://rubygems.org"

# The site is built and deployed by .github/workflows/pages.yml, so we pin the
# real Jekyll rather than the github-pages metagem. Local dev and CI run the
# exact same versions.
gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-feed",          "~> 0.17"
  gem "jekyll-sitemap",       "~> 1.4"
  gem "jekyll-seo-tag",       "~> 2.8"
  gem "jekyll-redirect-from", "~> 0.16"
end

# Windows and JRuby do not include zoneinfo files.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", platforms: [:mingw, :x64_mingw, :mswin]
