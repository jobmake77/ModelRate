# ModelRate Data Governance

ModelRate depends on user trust. Pricing, relay and commercial metadata must be explicit, auditable and conservative.

## Pricing Units

Internal model price unit:

```text
USD per 1M tokens
```

Token cost formula:

```text
input_cost = input_tokens / 1_000_000 * input_price_per_1m
output_cost = output_tokens / 1_000_000 * output_price_per_1m
total = (input_cost + output_cost + optional_costs) * request_count
total_cny = total_usd * usd_cny_rate
```

One-API / New API multiplier baseline:

```text
1x = USD 2 per 1M input tokens
```

## Source Types

Model prices use `PriceSourceType`:

```text
official
openrouter
litellm
portkey
manual
relay
```

Public source priority:

```text
official > manual > openrouter > litellm > portkey > relay
```

This priority lives in:

```text
lib/data-access/price-policy.ts
```

## Manual Planning Estimates

`manual` prices in seed/fixture data are MVP planning estimates.

They are useful for:

- Exercising the calculators.
- Testing price tables.
- Demonstrating data shape.
- Planning product workflows before all official prices are reviewed.

They are not:

- Official pricing.
- Automatically fetched pricing.
- A guarantee that the model/provider currently charges that amount.

Public display rules:

- Do not show raw `Manual planning estimate` to users.
- Display it as `人工预估（待核验）`.
- Add a visible note that the price is a planning estimate and needs official verification.

Current formatter:

```text
lib/formatters/source.ts
```

## Current Price Rules

For V1 public display:

- Each active model should have exactly one current public price.
- Current model prices must include `sourceUrl`.
- Current model prices must include `lastCheckedAt`.
- Negative prices are invalid.
- Public pages must show source and last checked.

Staleness:

- Older than 30 days: stale warning.
- Older than 90 days: high-priority review warning.

Production validation:

```bash
npm run ops:validate-launch-data
npm run ops:validate-launch-data:strict
```

## Relay Data Rules

Published relays must include:

- `name`
- `domain`
- `websiteUrl`
- `riskLevel`
- `lastCheckedAt`

If `hasReferralProgram = true`, `referralUrl` must be present.

If a relay is sponsored, referral-backed or verified:

- The label must be visible in lists.
- The label must be visible on detail pages.
- The label must not be disguised as natural ranking.

Unknown risk should not be used for public launch.

## Guide Data Rules

Published guides must include:

- `title`
- `description`
- `seoTitle`
- `seoDescription`
- `contentMd`

Guides should include `publishedAt`.

Thin or placeholder content should remain draft.

## Ads and Monetization

Ad placements are modeled but should remain disabled before explicit monetization approval.

Before enabling ads or paid placement:

- Privacy policy must cover analytics, ads and tracking behavior.
- Terms and disclaimer must cover commercial relationships.
- Sponsored/referral labels must be visible and accurate.
- Content quality should be sufficient for public traffic and AdSense review.

Validation blocks enabled ad placements unless explicitly allowed:

```bash
MODELRATE_ALLOW_ENABLED_ADS=true npm run ops:validate-launch-data
```

## Submissions and Click Tracking

Submissions:

- Public submissions are created as `pending`.
- Public submissions must not directly change public data.
- Honeypot and rate limit are enabled.

Outbound clicks:

- Only published relay website/referral exact URLs are allowed.
- Raw IP addresses are not stored.
- `ipHash` uses `CLICK_HASH_SALT`.

## Production Review Checklist

Before public launch:

- Review every current model price.
- Replace manual estimates with official or verified source records where possible.
- Confirm source URLs open and match the displayed price.
- Confirm last checked dates are current.
- Review all published relay risk labels.
- Confirm all sponsored/referral labels are present.
- Run launch data validation.
- Run production smoke checks.
