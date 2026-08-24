export const GARMENT_SIZING_VERSION = 1 as const;

export const GARMENT_SIZING_MODES = [
  "none",
  "alpha",
  "trouser",
  "shorts",
  "skirt",
] as const;

export const FIT_PROFILES = ["men", "women", "unisex"] as const;
export const MEASUREMENT_UNITS = ["in", "cm"] as const;
export const ALPHA_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

export type GarmentSizingMode = (typeof GARMENT_SIZING_MODES)[number];
export type RequiredGarmentSizingMode = Exclude<GarmentSizingMode, "none" | "alpha">;
export type AlphaSize = (typeof ALPHA_SIZES)[number];
export type FitProfile = (typeof FIT_PROFILES)[number];
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];
export type GarmentLengthType = "insideLeg" | "shortInseam" | "skirtLength";

export interface GarmentSizing {
  version: typeof GARMENT_SIZING_VERSION;
  mode: RequiredGarmentSizingMode;
  fitProfile: FitProfile;
  unit: MeasurementUnit;
  waist: number;
  hip: number;
  length: number;
  lengthType: GarmentLengthType;
}

export interface CategorySizingInput {
  slug?: string | null;
  sizingMode?: string | null;
}

interface MeasurementRange {
  min: number;
  max: number;
}

const INCH_TO_CM = 2.54;

const SLUG_MODE_FALLBACKS: Record<string, Exclude<GarmentSizingMode, "none">> = {
  shirt: "alpha",
  shirts: "alpha",
  "t-shirt": "alpha",
  "t-shirts": "alpha",
  tee: "alpha",
  tees: "alpha",
  top: "alpha",
  tops: "alpha",
  blouse: "alpha",
  blouses: "alpha",
  trouser: "trouser",
  trousers: "trouser",
  pant: "trouser",
  pants: "trouser",
  short: "shorts",
  shorts: "shorts",
  jort: "shorts",
  jorts: "shorts",
  "denim-shorts": "shorts",
  skirt: "skirt",
  skirts: "skirt",
};

const LENGTH_TYPES: Record<RequiredGarmentSizingMode, GarmentLengthType> = {
  trouser: "insideLeg",
  shorts: "shortInseam",
  skirt: "skirtLength",
};

const LENGTH_LABELS: Record<GarmentLengthType, string> = {
  insideLeg: "Inside leg",
  shortInseam: "Shorts inseam",
  skirtLength: "Skirt length",
};

const INCH_RANGES: Record<"waist" | "hip", MeasurementRange> &
  Record<GarmentLengthType, MeasurementRange> = {
  waist: { min: 20, max: 50 },
  hip: { min: 28, max: 70 },
  insideLeg: { min: 20, max: 50 },
  shortInseam: { min: 2, max: 20 },
  skirtLength: { min: 10, max: 50 },
};

export function resolveGarmentSizingMode(
  category?: CategorySizingInput | null,
): GarmentSizingMode {
  if (!category) return "none";

  if (
    category.sizingMode &&
    GARMENT_SIZING_MODES.includes(
      category.sizingMode as GarmentSizingMode,
    )
  ) {
    return category.sizingMode as GarmentSizingMode;
  }

  return SLUG_MODE_FALLBACKS[category.slug?.toLowerCase() ?? ""] ?? "none";
}

export function getLengthType(
  mode: RequiredGarmentSizingMode,
): GarmentLengthType {
  return LENGTH_TYPES[mode];
}

export function getLengthLabel(lengthType: GarmentLengthType): string {
  return LENGTH_LABELS[lengthType];
}

export function getMeasurementRange(
  measurement: "waist" | "hip" | GarmentLengthType,
  unit: MeasurementUnit,
): MeasurementRange {
  const range = INCH_RANGES[measurement];
  if (unit === "in") return range;

  return {
    min: roundMeasurement(range.min * INCH_TO_CM),
    max: roundMeasurement(range.max * INCH_TO_CM),
  };
}

export function getMeasurementSuggestions(
  measurement: "waist" | "hip" | GarmentLengthType,
  unit: MeasurementUnit,
): number[] {
  const inchValues =
    measurement === "insideLeg"
      ? [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 46, 50]
      : measurement === "shortInseam"
        ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 18, 20]
        : measurement === "skirtLength"
          ? [10, 12, 14, 17.5, 20, 21.5, 25, 30, 35, 40, 45, 50]
          : Array.from(
              { length: INCH_RANGES[measurement].max - INCH_RANGES[measurement].min + 1 },
              (_, index) => INCH_RANGES[measurement].min + index,
            );

  return unit === "in"
    ? inchValues
    : inchValues.map((value) => roundMeasurement(value * INCH_TO_CM));
}

export function validateGarmentSizing(
  sizing: GarmentSizing | undefined,
  requiredMode: RequiredGarmentSizingMode | "none",
): string[] {
  if (requiredMode === "none") {
    return sizing ? ["Measurements are not accepted for this product"] : [];
  }

  if (!sizing) return ["Choose your fit profile and measurements"];

  const errors: string[] = [];
  if (sizing.version !== GARMENT_SIZING_VERSION) {
    errors.push("This measurement format is no longer supported");
  }
  if (sizing.mode !== requiredMode) {
    errors.push("Measurements do not match this product category");
  }
  if (!FIT_PROFILES.includes(sizing.fitProfile)) {
    errors.push("Choose a valid fit profile");
  }
  if (!MEASUREMENT_UNITS.includes(sizing.unit)) {
    errors.push("Choose inches or centimetres");
  }

  const expectedLengthType = getLengthType(requiredMode);
  if (sizing.lengthType !== expectedLengthType) {
    errors.push("Choose the correct length measurement for this garment");
  }

  const measurements = [
    ["Waist", sizing.waist, getMeasurementRange("waist", sizing.unit)],
    ["Hip/seat", sizing.hip, getMeasurementRange("hip", sizing.unit)],
    [
      getLengthLabel(expectedLengthType),
      sizing.length,
      getMeasurementRange(expectedLengthType, sizing.unit),
    ],
  ] as const;

  for (const [label, value, range] of measurements) {
    if (!Number.isFinite(value) || value < range.min || value > range.max) {
      errors.push(`${label} must be between ${range.min} and ${range.max} ${sizing.unit}`);
    }
  }

  return errors;
}

export function validateProductSizing(
  sizing: GarmentSizing | undefined,
  alphaSize: AlphaSize | undefined,
  requiredMode: GarmentSizingMode,
): string[] {
  if (requiredMode === "alpha") {
    const errors: string[] = [];
    if (!alphaSize) errors.push("Choose a shirt size");
    if (alphaSize && !ALPHA_SIZES.includes(alphaSize)) {
      errors.push("Choose a valid shirt size");
    }
    if (sizing) errors.push("Body measurements are not accepted for this product");
    return errors;
  }

  const errors = validateGarmentSizing(sizing, requiredMode);
  if (alphaSize) errors.push("A letter size is not accepted for this product");
  return errors;
}

export function createCartLineId(
  productId: string,
  sizing?: GarmentSizing,
  alphaSize?: AlphaSize,
): string {
  if (alphaSize) return `${productId}:alpha:${alphaSize}`;
  if (!sizing) return productId;

  return [
    productId,
    sizing.version,
    sizing.mode,
    sizing.fitProfile,
    sizing.unit,
    sizing.waist,
    sizing.hip,
    sizing.lengthType,
    sizing.length,
  ].join(":");
}

export function formatGarmentSizing(sizing?: GarmentSizing | null): string {
  if (!sizing) return "";

  const profile =
    sizing.fitProfile === "men"
      ? "Men's cut"
      : sizing.fitProfile === "women"
        ? "Women's cut"
        : "Unisex/custom cut";

  return `${profile} · Waist ${sizing.waist} ${sizing.unit} · Hip/seat ${sizing.hip} ${sizing.unit} · ${getLengthLabel(sizing.lengthType)} ${sizing.length} ${sizing.unit}`;
}

export function normalizeGarmentSizing(value: unknown): GarmentSizing | null {
  if (!value || typeof value !== "object") return null;

  const sizing = value as Partial<GarmentSizing>;
  if (
    sizing.version !== GARMENT_SIZING_VERSION ||
    !sizing.mode ||
    !GARMENT_SIZING_MODES.includes(sizing.mode) ||
    !sizing.fitProfile ||
    !FIT_PROFILES.includes(sizing.fitProfile) ||
    !sizing.unit ||
    !MEASUREMENT_UNITS.includes(sizing.unit) ||
    !sizing.lengthType ||
    !["insideLeg", "shortInseam", "skirtLength"].includes(sizing.lengthType) ||
    !Number.isFinite(sizing.waist) ||
    !Number.isFinite(sizing.hip) ||
    !Number.isFinite(sizing.length)
  ) {
    return null;
  }

  return sizing as GarmentSizing;
}

function roundMeasurement(value: number): number {
  return Math.round(value * 10) / 10;
}
