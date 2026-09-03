#!/usr/bin/env ruby
# frozen_string_literal: true

# Walks the built site and fails if any internal href/src points at something
# that was not generated. Catches the classic Jekyll rebuild mistake: a link
# written against a permalink that no longer exists.

require "set"

SITE = File.expand_path("../_site", __dir__)

abort "No _site/ directory — run `bundle exec jekyll build` first." unless Dir.exist?(SITE)

# Every path the built site actually serves.
served = Set.new
Dir.glob("#{SITE}/**/*", File::FNM_DOTMATCH).each do |path|
  next if File.directory?(path)

  rel = path.delete_prefix(SITE)
  served << rel
  # /a/b/index.html is served as /a/b/ and /a/b
  next unless File.basename(rel) == "index.html"

  dir = File.dirname(rel)
  served << (dir == "/" ? "/" : "#{dir}/")
  served << dir unless dir == "/"
end

LINK_RE = /(?:href|src)\s*=\s*["']([^"']+)["']/i

broken = Hash.new { |h, k| h[k] = [] }

Dir.glob("#{SITE}/**/*.html").each do |file|
  page = file.delete_prefix(SITE)

  File.read(file).scan(LINK_RE).flatten.each do |raw|
    link = raw.strip

    # Skip anything that leaves the site or is not a document reference.
    next if link.empty?
    next if link.start_with?("http://", "https://", "//", "mailto:", "tel:", "data:", "#", "javascript:")

    # Root-relative only; the site emits no document-relative links.
    next unless link.start_with?("/")

    target = link.split("#").first.split("?").first
    next if target.nil? || target.empty?

    target = begin
      require "cgi"
      CGI.unescape(target)
    rescue StandardError
      target
    end

    next if served.include?(target)
    next if served.include?("#{target}/")
    next if served.include?("#{target}/index.html")
    next if served.include?(target.chomp("/"))

    broken[page] << link
  end
end

if broken.empty?
  puts "Link check passed — no broken internal links."
  exit 0
end

count = broken.values.sum(&:size)
warn "Broken internal links (#{count}):"
broken.sort.each do |page, links|
  warn "  #{page}"
  links.uniq.sort.each { |l| warn "    -> #{l}" }
end
exit 1
