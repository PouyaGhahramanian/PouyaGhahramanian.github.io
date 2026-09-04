---
title: "Language models go stale. LLM-OFA is about what to do between retrains."
date: 2025-11-10
excerpt: >-
  A fine-tuned classifier degrades as the world moves on, and the usual answer —
  retrain periodically — leaves the model wrong for the whole gap. Our CIKM 2025
  paper treats adaptation as something that happens continuously, one instance at
  a time.
tags:
  - concept drift
  - large language models
  - online learning
---

Fine-tune a language model on news from 2010 and evaluate it on news from 2020,
and it will be worse. Not because the architecture aged, but because the world
did: new entities appear, familiar words drift into new senses, and the mapping
from text to label that the model learned no longer describes the data it is
being shown.

The usual answer is to retrain on a schedule. Quarterly, monthly, whenever
someone notices the dashboards sagging. But that answer has a hole in the middle
of it: **between retrains, the model is wrong and nobody is doing anything about
it.** The longer the retraining cadence, the wider the hole.

Our CIKM 2025 paper, [LLM-OFA]({{ '/publications/llm-ofa/' | relative_url }}),
is about closing that gap.

## The setting: adaptation as a stream, not a schedule

We frame it as **On-the-Fly Adaptation (OFA)**, and the framing matters more
than any single technique in the paper.

Each incoming instance is first used for *inference* — the model predicts, and
that prediction is what the user actually gets. Only afterwards is the true label
revealed, and the model updated. Single-pass, sequential, no second look at the
data.

That ordering is the whole point. It means:

- Every evaluation number is an **honest prequential score**. The model is always
  scored on data it has not yet learned from, which is exactly the position a
  deployed model is in.
- There is no train/test split to leak across, because there is no split.
- The cost of adaptation is bounded by construction: one pass, one update.

It is a deliberately harsh setting, and it is the realistic one.

## 1M-News: a benchmark that actually spans a drift

Most concept-drift benchmarks are small, synthetic, or both — you inject a
distribution shift at instance 5,000 and see whether the detector notices. That
tells you something, but it does not tell you how a model behaves over a decade
of gradual semantic movement.

So we built **1M-News**: one million New York Times headlines spanning
**2005–2025**, labelled by section. Two decisions in it were more consequential
than they look.

**Consolidating the label space.** The raw corpus has 87 sections, many of them
near-duplicates or vanishingly rare, and several that appear or disappear
mid-stream. We consolidated them into a stable set (Real Estate folded into
Business, and so on). Without that, you measure the newsroom reorganising its
own taxonomy rather than the language changing — a real drift, but not the one
under study.

**Handling long items.** News text items run long, and truncating at 512 tokens
throws away exactly the context that disambiguates a drifting entity. We use Big
Bird's tokenizer so that the ultra-long tail stays intact.

The result is a benchmark where the drift is *endogenous*. Nobody injected it.
It is simply what twenty years of news looks like.

## Adaptimizer: fast weights and slow weights, and only moving where they agree

The obvious way to adapt continuously is to keep running SGD on the incoming
stream. The obvious problem with that is equally well known: you get
**catastrophic forgetting**, and you get a model that chases every burst of
noise. Turn the learning rate down instead and you get stability, and no
adaptation.

That tension — plasticity against stability — is the actual problem, and it is
not solved by finding a cleverer learning rate.

**Adaptimizer** keeps *two* sets of weights:

- a **fast** set that moves quickly and tracks recent data,
- a **slow** set that moves conservatively and holds the long-run structure.

The update is then gated on **elementwise agreement between the two**. Where fast
and slow both push a parameter the same way, that is evidence of real signal, and
the parameter moves. Where they disagree, the fast set is reacting to something
the slow set does not corroborate — most likely noise — and the update is damped.

The intuition is a consensus rule rather than a compromise. A blend of two
learning rates is still one learning rate. Requiring two differently-tempered
estimates to *agree* before committing is a different thing: it makes the
optimizer's confidence depend on the data rather than on a hyperparameter you
guessed in advance.

Across the benchmark, OFA with Adaptimizer improves consistently over static
baselines — models that were fine-tuned once and then left to face two decades
of news on their own.

## What I would tell someone building this in production

Three things generalise past the paper.

**Prequential evaluation is not a nicety.** If your offline number comes from a
random split of a temporally-ordered dataset, it is measuring the wrong thing and
it is measuring it optimistically. Score on the future, always.

**"We retrain quarterly" is a statement about your error budget.** It says you
have accepted being progressively wrong for up to three months at a time. That
may well be the right call — but it should be a decision, not a default.

**Stability is a first-class objective.** An adaptive system that occasionally
lurches is worse than a static one, because nobody can reason about it. Most of
the engineering in Adaptimizer is not about adapting faster; it is about not
adapting to the wrong things.

---

The paper is at [ACM CIKM 2025](https://dl.acm.org/doi/abs/10.1145/3746252.3760846),
and the code and the 1M-News data are at
[github.com/PouyaGhahramanian/LLM-OFA](https://github.com/PouyaGhahramanian/LLM-OFA).
Joint work with Sepehr Bakhshi and Prof. Fazlı Can at the
Bilkent Information Retrieval Group.
