# Garment sizing and order-line measurement architecture

## Status

Accepted — 2026-08-24

## Context

Customers ordering shirts and related tops need to select a compulsory letter
size. Customers ordering trousers, shorts, jorts, or skirts need to provide the
body and length measurements required to make or select the garment. These
values must remain visible on the paid order.

A single generic "leg length" field is not accurate across these categories.
Trouser length is an inside-leg measurement, short/jort inseam ends at the
desired hem, and skirt length is measured from the waist to the desired hem.
Established bottom-size guides also use hip/seat alongside waist, especially
for women's trousers and skirts.

## Research basis

- ISO 8559-1 defines anthropometric body-measurement procedures for clothing.
- ISO 8559-2:2025 distinguishes body dimensions used for size designation from
  garment measurements chosen by a designer.
- Levi's and Nike bottom guides use waist, hip/seat, and inseam and instruct
  customers to keep circumference measurements horizontal.
- ASOS defines trouser inside leg from the crotch to the ankle and defines skirt
  fit with waist and hip; skirt length varies by style.
- NIST defines one inch as exactly 2.54 centimetres.

## Decision

### Product classification

Categories expose a `sizingMode` with one of `none`, `alpha`, `trouser`,
`shorts`, or `skirt`. Known category slugs are supported as a compatibility
fallback so the feature works before every existing Sanity category is updated.

### Letter-sized products

Shirts and other categories configured as `alpha` require exactly one of:
`S`, `M`, `L`, `XL`, `2XL`, `3XL`, or `4XL`. The selected size participates in
cart-line identity and is copied into the paid order item. Known shirt, T-shirt,
tee, top, and blouse slugs use `alpha` as a compatibility fallback.

### Required customer input

Applicable products require a versioned sizing object containing:

- fit profile: men's cut, women's cut, or unisex/custom cut;
- unit: inches or centimetres;
- natural waist circumference;
- fullest hip/seat circumference;
- category-specific length: inside leg, short/jort inseam, or waist-to-hem
  skirt length.

The UI provides common values as suggestions while retaining a numeric custom
entry. The fit profile describes the block/cut used to construct the garment;
it is not treated as an assertion about the customer's identity.

### Ranges

- Waist: 20–50 in (50.8–127 cm).
- Hip/seat: 28–70 in (71.1–177.8 cm).
- Trouser inside leg: 20–50 in (50.8–127 cm).
- Shorts/jorts inseam: 2–20 in (5.1–50.8 cm).
- Skirt waist-to-hem length: 10–50 in (25.4–127 cm).

The shorter category-specific minimums are intentional: forcing a 20-inch
minimum on shorts or a generic leg-length field on skirts would reject normal
garments and record the wrong production instruction.

### Cart and inventory

The cart identity is product plus sizing configuration. This permits two lines
of the same product for different letter sizes, people, or measurements. Stock
checks and inventory decrements aggregate quantities by product so multiple
configurations cannot reserve more than the product's total stock.

### Trust boundary and persistence

- The client provides a sizing configuration for usability.
- Checkout resolves the authoritative product and category from Sanity and
  validates that the required sizing mode and ranges match.
- Paystack metadata version 3 carries the validated sizing snapshot.
- Fulfilment copies that immutable snapshot into each Sanity order item.
- Customer and administrator order views display the recorded measurements.

## Consequences

- Existing non-garment products and old orders remain valid without sizing.
- Existing saved cart data is migrated to line IDs during hydration.
- A product moved into or out of an applicable category is revalidated at
  checkout, preventing stale cart configuration from bypassing requirements.
- Categories should be explicitly classified in Studio even though known slugs
  have a fallback.

## Validation plan

- Unit-test ranges, units, category modes, distinct configured lines, and
  aggregated stock handling.
- Verify letter-sized products cannot reach Paystack without an allowed size.
- Verify measured products cannot reach Paystack without complete valid input.
- Verify ordinary products continue to add and checkout unchanged.
- Verify two differently sized lines of the same product share the same stock.
- Verify measurements appear in cart, checkout, customer orders, admin orders,
  and Sanity Studio.
