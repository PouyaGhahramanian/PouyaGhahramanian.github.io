---
title: "Time-series foundation models and the problem of the label that hasn't arrived yet"
date: 2026-06-18
excerpt: >-
  Zero-shot forecasters are genuinely good now. What they are not is current —
  and unlike a text classifier, a forecaster cannot be corrected the moment it is
  wrong, because the truth it is being scored against is still in the future.
tags:
  - time series
  - foundation models
  - forecasting
  - concept drift
---

The past two years quietly changed what a forecasting baseline looks like.

For most of my career the honest answer to "what should I try first on this
series?" was a seasonal naive model and then some flavour of gradient boosting on
lag features. **Time-series foundation models (TSFMs)** — pretrained on very large
and very heterogeneous collections of series, then applied zero-shot — have moved
that line. You can now point a pretrained model at a series it has never seen and
get a forecast that is competitive with something you would have spent a week
fitting.

That is a real shift, and I do not want to undersell it. But working with
forecasts in production has made me sharply aware of what it does *not* solve.

## Pretrained is not the same as current

A TSFM's pretraining corpus has an end date. Everything after that is, from the
model's point of view, out of distribution.

For a lot of series that hardly matters — weekly seasonality in electricity
demand is not going to be rewritten. For the series people actually care about
commercially, it matters a great deal. Retail demand carries promotions, price
changes, assortment churn, competitor behaviour, and the occasional structural
break that makes the last three years of history actively misleading. The
regularities the model learned are still true on average and wrong exactly where
the money is.

So the same question I have been chasing in text streams shows up again:
**how does a pretrained model keep up with a world that moves after pretraining
ends?**

## Why forecasting makes adaptation harder than classification

In the [online setting I have worked in
before]({{ '/blog/2025/11/llm-ofa-temporal-drift/' | relative_url }}), the loop
is tight. The model predicts a label, the true label is revealed, the model
updates. Uncomfortable, but clean.

Forecasting breaks that loop in a way I do not think is appreciated enough.

**Supervision is delayed, and the delay is the horizon.** Predict 28 days ahead
and you find out how wrong you were in 28 days. At any moment, the most recent
feedback you have concerns a forecast you made a month ago, about a world that
has since moved on. Every update you make is an update based on stale evidence.

**The feedback is staggered.** Forecasts made on different days for different
horizons resolve at different times, so the error signal arrives as a continuous
dribble of partially-complete information rather than a clean batch.

**Actions contaminate the labels.** This one is specific to production and it is
brutal. A demand forecast drives a replenishment decision. That decision changes
what is on the shelf. What is on the shelf changes what sells. So the "true"
demand you eventually score against is partly a consequence of your own earlier
forecast. Under-forecast, stock out, observe low sales, conclude demand was low,
under-forecast again — a feedback loop that looks like model drift and is
actually a decision loop eating itself. Censored-demand correction is not a nice
refinement here; without it, adaptation actively makes things worse.

**And you cannot retrain your way out.** Full fine-tuning of a foundation model
on every batch of arriving truth is not affordable, which is why parameter-efficient
approaches — LoRA and friends — are the obvious lever. But they only reframe the
question: you still have to decide *when* to move the adapter weights, and by how
much, on evidence that is late and incomplete.

## What I think the shape of the answer looks like

I will not pretend this is settled — a chunk of it is work that is currently under
review, and I would rather write about it once it has survived that. But the
principles I have most confidence in are ones I would defend regardless of how the
results land.

**Distinguish a shock from a regime change.** A single large error is usually not
a reason to move. A run of same-signed errors probably is. Almost all the value in
an adaptive forecaster lies in that distinction, and almost none of it lies in
adapting faster.

**Prefer agreement over speed.** The pattern that keeps working — in
[AdaNEN]({{ '/publications/adanen/' | relative_url }}), in
[Adaptimizer]({{ '/publications/llm-ofa/' | relative_url }}), in the forecasting
setting — is to require two differently-tempered views of the data to agree before
committing to an update. A fast estimator alone chases noise. A slow one alone
never arrives. Requiring corroboration makes the system's willingness to change a
function of the evidence rather than of a hyperparameter.

**Evaluate on the decision, not the metric.** WMAPE going down is not the goal.
Fewer stockouts and less dead stock is the goal, and the two come apart more often
than is comfortable — most obviously because forecast error is not symmetric in
cost. Being 10 units short is not the same kind of wrong as being 10 units long.

**Assume you are inside a feedback loop.** If your model's output changes the
world that generates your training data, you are not doing supervised learning in
the sense the textbook means. Design the evaluation accordingly.

## The unglamorous conclusion

TSFMs move the starting line, and that is worth a lot: less bespoke modelling per
series, a much stronger cold-start, genuinely useful zero-shot behaviour.

They do not remove the need to keep a model honest after deployment. If anything
they sharpen it, because a large pretrained model is expensive enough that the
retrain-often reflex stops being available and you are forced to think properly
about what adaptation should mean.

Which is, more or less, the thing I have been working on from three different
directions for six years.
