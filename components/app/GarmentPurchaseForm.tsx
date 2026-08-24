"use client";

import { useId, useState } from "react";
import { Ruler, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCartActions,
  useProductQuantity,
} from "@/lib/store/cart-store-provider";
import {
  GARMENT_SIZING_VERSION,
  getLengthLabel,
  getLengthType,
  getMeasurementRange,
  getMeasurementSuggestions,
  validateGarmentSizing,
  type FitProfile,
  type GarmentSizing,
  type MeasurementUnit,
  type RequiredGarmentSizingMode,
} from "@/lib/sizing/garment-sizing";

interface GarmentPurchaseFormProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  slug: string;
  mode: RequiredGarmentSizingMode;
}

export function GarmentPurchaseForm({
  productId,
  name,
  price,
  image,
  stock,
  slug,
  mode,
}: GarmentPurchaseFormProps) {
  const id = useId().replaceAll(":", "");
  const { addItem, openCart } = useCartActions();
  const productQuantity = useProductQuantity(productId);
  const [fitProfile, setFitProfile] = useState<FitProfile | "">("");
  const [unit, setUnit] = useState<MeasurementUnit>("in");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [length, setLength] = useState("");

  const lengthType = getLengthType(mode);
  const lengthLabel = getLengthLabel(lengthType);
  const isOutOfStock = stock <= 0;
  const isAtMax = productQuantity >= stock;

  const changeUnit = (nextUnit: MeasurementUnit) => {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    setWaist("");
    setHip("");
    setLength("");
  };

  const handleAdd = () => {
    if (isOutOfStock || isAtMax) return;

    if (!fitProfile) {
      toast.error("Choose a gender / fit profile");
      return;
    }

    const sizing: GarmentSizing = {
      version: GARMENT_SIZING_VERSION,
      mode,
      fitProfile,
      unit,
      waist: Number(waist),
      hip: Number(hip),
      length: Number(length),
      lengthType,
    };
    const errors = validateGarmentSizing(sizing, mode);

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    addItem({ productId, name, price, image, slug, sizing }, 1);
    openCart();
    toast.success(`Added ${name} with your measurements`);
  };

  const fields = [
    {
      key: "waist",
      label: "Natural waist circumference",
      value: waist,
      setter: setWaist,
      help: "Measure around your natural waist with the tape horizontal.",
    },
    {
      key: "hip" as const,
      label: "Hip / seat circumference",
      value: hip,
      setter: setHip,
      help: "Measure around the fullest part of your hips and seat.",
    },
    {
      key: lengthType,
      label: lengthLabel,
      value: length,
      setter: setLength,
      help:
        lengthType === "insideLeg"
          ? "Measure from the crotch down the inside leg to the ankle."
          : lengthType === "shortInseam"
            ? "Measure from the crotch down the inside seam to your desired shorts hem."
            : "Measure from your natural waist down to your desired skirt hem.",
    },
  ] as const;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-900">
          <Ruler className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold">Your measurements are required</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Choose a suggested value or type your exact measurement. Use body
            measurements unless the length instruction says desired hem.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-fit`}>Gender / fit profile</Label>
          <select
            id={`${id}-fit`}
            value={fitProfile}
            onChange={(event) => setFitProfile(event.target.value as FitProfile | "")}
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            required
          >
            <option value="">Select a fit profile</option>
            <option value="men">Men&apos;s cut</option>
            <option value="women">Women&apos;s cut</option>
            <option value="unisex">Unisex / custom cut</option>
          </select>
          <p className="text-xs text-zinc-500">
            This selects the garment block and does not define your identity.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${id}-unit`}>Measurement unit</Label>
          <select
            id={`${id}-unit`}
            value={unit}
            onChange={(event) => changeUnit(event.target.value as MeasurementUnit)}
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="in">Inches (in)</option>
            <option value="cm">Centimetres (cm)</option>
          </select>
          <p className="text-xs text-zinc-500">
            Changing the unit clears the values to prevent conversion mistakes.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {fields.map((field) => {
          const range = getMeasurementRange(field.key, unit);
          const suggestions = getMeasurementSuggestions(field.key, unit);
          const listId = `${id}-${field.key}-values`;

          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${id}-${field.key}`}>
                {field.label} ({unit})
              </Label>
              <Input
                id={`${id}-${field.key}`}
                type="number"
                inputMode="decimal"
                list={listId}
                min={range.min}
                max={range.max}
                step="0.1"
                value={field.value}
                onChange={(event) => field.setter(event.target.value)}
                placeholder={`${range.min}–${range.max}`}
                required
              />
              <datalist id={listId}>
                {suggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              <p className="text-xs leading-4 text-zinc-500">{field.help}</p>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        onClick={handleAdd}
        disabled={isOutOfStock || isAtMax}
        className="mt-5 h-11 w-full"
      >
        <ShoppingBag className="mr-2 h-4 w-4" />
        {isOutOfStock
          ? "Out of stock"
          : isAtMax
            ? "Maximum available quantity in basket"
            : "Add to basket with measurements"}
      </Button>
    </section>
  );
}
