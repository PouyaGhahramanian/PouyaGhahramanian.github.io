---
layout: home
permalink: /
title: "Pouya Ghahramanian"
redirect_from:
  - /markdown/
  - /md/
  - /markdown.html
  - /non-menu-page/
  - /nmp/
  - /nmp.html
  - /archive-layout-with-content/
  - /terms/
  - /talkmap.html
  - /talkmap/map.html
  - /markdown_generator/
  - /_pages/sitemap/
  - /about/
  - /about.html
hero:
  eyebrow: "Bilkent University · BilIR"
  headline: "Machine learning for data that never stops changing."
  standfirst: >-
    I am a PhD researcher at Bilkent University, working with Prof. Fazlı Can in
    the Bilkent Information Retrieval Group. My research is about models that
    keep learning after deployment — detecting concept drift, adapting on the
    fly, and holding accuracy as the underlying distribution moves.
  secondary: >-
    Alongside the PhD I am a data scientist at Invent.ai, where the same problem
    shows up with money attached: demand forecasts for roughly a million
    SKU-store pairs, retrained and re-evaluated against a world that shifts every
    week.
threads:
  - id: drift
    term: "Concept drift"
    definition: >-
      Detecting when a data stream's underlying distribution has moved — including
      when no labels are available to tell you.
    work: "LACE"
  - id: online
    term: "Online & continual learning"
    definition: >-
      Single-pass architectures that update as data arrives, instead of retraining
      from scratch on a schedule.
    work: "AdaNEN · BELS"
  - id: foundation
    term: "Adapting foundation models"
    definition: >-
      Keeping large language and time-series foundation models current under
      temporal drift and delayed supervision.
    work: "LLM-OFA"
metrics:
  - figure: "8.8%"
    label: "accuracy gain"
    note: "AdaNEN, across 13 benchmark datasets"
  - figure: "63.5%"
    label: "lower detection delay"
    note: "LACE, at a 0% missed-detection rate"
  - figure: "2 decades"
    label: "of news, continually adapted"
    note: "LLM-OFA, ACM CIKM 2025"
---

## Currently

I split my time between two versions of the same question.

At **Bilkent** I am a named senior researcher on three TÜBİTAK-funded R&D programs
(117E870, 120E103, 125E060), leading the machine-learning workstream on
classification, anomaly detection and concept-drift adaptation over large-scale
streaming data. I have been with the group since 2019, first for my M.Sc. and now
the PhD.

At **Invent.ai** I own demand forecasting and replenishment models in production
for three enterprise retail clients. Last year that work cut lost sales by 10%
for one client — the same drift problem, but where being wrong shows up on a
shelf.

I also review for **ACM SIGIR**, **CIKM** and **SIGIR-AP**, and teach Information
Retrieval, Algorithms and Computer Organization at Bilkent.
