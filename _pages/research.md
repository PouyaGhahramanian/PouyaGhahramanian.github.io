---
layout: page
permalink: /research/
title: "Research"
standfirst: >-
  Models are trained once and then asked to survive a world that keeps moving.
  My work is about the gap between those two facts.
redirect_from:
  - /portfolio/

---

## The problem

Almost everything in production machine learning assumes the future resembles
the training set. It rarely does. Vocabulary shifts, demand patterns break,
sensors drift, a pandemic rewrites a category overnight. The model does not
fail loudly — it degrades quietly, and by the time offline metrics catch up the
damage is done.

Three questions follow from that, and they are the three strands of my work.

---

## Detecting that something changed

**Concept drift detection** is the first problem, and the hard version is the
unsupervised one: knowing the distribution has moved *before* the labels arrive
to prove it. In most real deployments labels are delayed by weeks, or never
arrive at all.

**LACE** (2026, ACM CIKM) attacks this for multi-label streams by
watching how clusters of co-occurring labels evolve, rather than watching a
performance metric that needs ground truth. Against the previous best
unsupervised method it reduces detection delay by **63.5%** while keeping a
**0% missed-detection rate**.

## Learning continuously, in one pass

Once you know the world moved, you have to move with it — without retraining
from scratch every time.

**AdaNEN** (2024, ACM TKDD) is a neural ensemble architecture for
evolving text streams that learns on the fly, in a single pass, adapting its
own capacity as drift arrives. It improves classification accuracy by up to
**8.8%** across **13 benchmark datasets**, and grew out of my M.Sc. thesis.
**BELS** (2023, IEEE Access) explores the same territory with broad
rather than deep learning, where fast incremental updates matter more than
depth.

## Keeping foundation models current

The newest strand, and where most of my attention is now: foundation models are
enormously expensive to retrain, which makes drift a much sharper problem for
them than for a small online classifier.

**LLM-OFA** (2025, ACM CIKM) proposes an On-the-Fly Adaptation framework
and an optimizer called **Adaptimizer** for continually adapting large language
models under temporal drift, evaluated across two decades of news.

**CoSign** (under review, AAAI 2027) carries the idea to time-series foundation
models. It adapts a model's LoRA weights under *delayed supervision* — the
realistic setting where a prediction's label only arrives much later — using a
dual-timescale co-signed consensus rule. It ranks **first against 14 streaming
optimizers across 17 datasets**.

---

## Where this gets tested

Working at [Invent.ai](https://invent.ai) is the honest version of an ablation
study. Demand forecasting across roughly a million SKU-store pairs is a drifting
stream with consequences: promotions, stockouts, seasonality and supply shocks
all move the distribution, and the evaluation loop is a real replenishment
decision rather than a held-out split.

Most of what I believe about backtesting design, holdout construction and drift
monitoring came from that side of the desk rather than from the literature.

<p class="page__cta">
  <a class="button" href="{{ '/publications/' | relative_url }}">Full publication list</a>
  <a class="button button--ghost" href="{{ site.author.scholar }}">Google Scholar</a>
</p>
