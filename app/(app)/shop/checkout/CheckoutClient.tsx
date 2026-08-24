"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, AlertTriangle, Loader2, CreditCard, CheckCircle, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import {
  useCartItems,
  useTotalPrice,
} from "@/lib/store/cart-store-provider";
import { useCartStock } from "@/lib/hooks/useCartStock";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { ProductSizingDetails } from "@/components/app/ProductSizingDetails";
import {
  calculateShippingFee,
} from "@/lib/constants/payment";

interface CheckoutClientProps {
  settings: {
    shippingLagos?: number | null;
    shippingRestOfNigeria?: number | null;
    shippingAfrica?: number | null;
    shippingInternational?: number | null;
  } | null;
}

const COUNTRIES = [
  {
    group: "Africa", items: [
      { code: "NG", name: "Nigeria" },
      { code: "GH", name: "Ghana" },
      { code: "KE", name: "Kenya" },
      { code: "ZA", name: "South Africa" },
      { code: "EG", name: "Egypt" },
      { code: "RW", name: "Rwanda" },
      { code: "SN", name: "Senegal" },
    ]
  },
  {
    group: "International", items: [
      { code: "US", name: "United States" },
      { code: "GB", name: "United Kingdom" },
      { code: "CA", name: "Canada" },
      { code: "AU", name: "Australia" },
      { code: "DE", name: "Germany" },
      { code: "FR", name: "France" },
      { code: "ES", name: "Spain" },
      { code: "IT", name: "Italy" },
      { code: "NL", name: "Netherlands" },
    ]
  }
];

export function CheckoutClient({ settings }: CheckoutClientProps) {
  const router = useRouter();
  const items = useCartItems();
  const subtotal = useTotalPrice();
  const { isLoading: isStockLoading, hasStockIssues } = useCartStock(items);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postcode: "",
    country: "NG",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Default rates fallback
  const rates = useMemo(
    () => ({
      shippingLagos: settings?.shippingLagos ?? 50,
      shippingRestOfNigeria: settings?.shippingRestOfNigeria ?? 10_000,
      shippingAfrica: settings?.shippingAfrica ?? 20_000,
      shippingInternational: settings?.shippingInternational ?? 50_000,
    }),
    [settings],
  );

  const shippingFee = formData.country
    ? calculateShippingFee(formData.country, formData.state, rates)
    : 0;
  const total = subtotal + shippingFee;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.line1.trim()) errors.line1 = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state.trim()) errors.state = "State/Region is required";
    if (!formData.postcode.trim()) errors.postcode = "Postcode/Zip code is required";
    if (!formData.country) errors.country = "Country is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!validateForm()) {
      toast.error("Form Validation Failed", {
        description: "Please fill in all required delivery details.",
      });
      return;
    }

    startTransition(async () => {
      const result = await createCheckoutSession(items, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        line1: formData.line1,
        line2: formData.line2,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country,
      });

      if (result.success && result.url) {
        // Redirect to gateway checkout url
        router.push(result.url);
      } else {
        const errMsg = result.error ?? "Checkout failed";
        setPaymentError(errMsg);
        toast.error("Checkout Error", {
          description: errMsg,
        });
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Your cart is empty
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Add some items to your cart before checking out.
          </p>
          <Button asChild className="mt-8">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/shop"
            className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Checkout
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          Secure checkout verified
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Form */}
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/60 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
              <Truck className="h-5 w-5 text-zinc-500" />
              Delivery Details
            </h2>

            <div className="space-y-4">
              {/* Name & Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`rounded-lg ${formErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500 font-medium">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`rounded-lg ${formErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500 font-medium">{formErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+234 80 1234 5678"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`rounded-lg ${formErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-500 font-medium">{formErrors.phone}</p>
                )}
              </div>

              {/* Address Lines */}
              <div className="space-y-2">
                <Label htmlFor="line1" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="line1"
                  name="line1"
                  type="text"
                  placeholder="Plot 12, Victoria Island"
                  autoComplete="address-line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  className={`rounded-lg ${formErrors.line1 ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {formErrors.line1 && (
                  <p className="text-xs text-red-500 font-medium">{formErrors.line1}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="line2" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Apartment, Suite, Unit, etc. <span className="text-zinc-400">(Optional)</span>
                </Label>
                <Input
                  id="line2"
                  name="line2"
                  type="text"
                  placeholder="Apartment 4B"
                  autoComplete="address-line2"
                  value={formData.line2}
                  onChange={handleInputChange}
                  className="rounded-lg"
                />
              </div>

              {/* Country, State, City, Postcode */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    autoComplete="country"
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                  >
                    {COUNTRIES.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {formErrors.country && (
                    <p className="text-xs text-red-500 font-medium">{formErrors.country}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    State / Region <span className="text-red-500">*</span>
                  </Label>
                  {formData.country === "NG" ? (
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      autoComplete="address-level1"
                      className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                    >
                      <option value="">Select State</option>
                      <option value="Lagos">Lagos State (₦50 Delivery)</option>
                      <option value="Abuja">Abuja (₦10,000 Delivery)</option>
                      <option value="Rivers">Rivers (₦10,000 Delivery)</option>
                      <option value="Oyo">Oyo (₦10,000 Delivery)</option>
                      <option value="Kano">Kano (₦10,000 Delivery)</option>
                      <option value="Other">Other Nigeria State (₦10,000 Delivery)</option>
                    </select>
                  ) : (
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="e.g. California / Greater London"
                      autoComplete="address-level1"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`rounded-lg ${formErrors.state ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  )}
                  {formErrors.state && (
                    <p className="text-xs text-red-500 font-medium">{formErrors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Ikeja"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`rounded-lg ${formErrors.city ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {formErrors.city && (
                    <p className="text-xs text-red-500 font-medium">{formErrors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Postcode / ZIP <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    type="text"
                    placeholder="100001"
                    autoComplete="postal-code"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    className={`rounded-lg ${formErrors.postcode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {formErrors.postcode && (
                    <p className="text-xs text-red-500 font-medium">{formErrors.postcode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: Order & Pricing Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/60 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
              Payment Summary
            </h2>

            {/* Cart Items List */}
            <div className="max-h-48 overflow-y-auto mb-4 divide-y divide-zinc-100 dark:divide-zinc-800/60 pr-1">
              {items.map((item) => (
                <div key={item.lineId} className="py-3 flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[8px] text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">Qty: {item.quantity} • {formatPrice(item.price)} each</p>
                    {(item.sizing || item.alphaSize) && (
                      <ProductSizingDetails
                        sizing={item.sizing}
                        alphaSize={item.alphaSize}
                        className="mt-1"
                        compact
                      />
                    )}
                  </div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Billing breakdown */}
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  Transportation Fee
                  <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                    <Info className="h-3.5 w-3.5" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 rounded bg-zinc-900 p-2 text-[10px] font-normal leading-normal text-white shadow dark:bg-zinc-800">
                      Lagos: ₦50 • Other NG: ₦10k • Africa: ₦20k • Intl: ₦50k
                    </span>
                  </span>
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {shippingFee > 0 ? formatPrice(shippingFee) : <span className="text-xs text-amber-600">Calculated</span>}
                </span>
              </div>

              {/* Gateway badge */}
              <div className="pt-2">
                <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800/40 dark:bg-zinc-900/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Gateway Route</span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Paystack (all destinations)
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-300">
                    Paystack
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 pt-4">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-zinc-900 dark:text-zinc-100">Total</span>
                  <span className="text-zinc-900 dark:text-zinc-100 text-lg">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Submit checkout */}
            <div className="mt-6">
              <Button
                onClick={handleCheckoutSubmit}
                disabled={hasStockIssues || isStockLoading || isPending || items.length === 0}
                size="lg"
                className="w-full font-bold shadow-md tracking-wide active:scale-[0.98] transition-transform duration-100"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting to payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay {formatPrice(total)} with Paystack
                  </>
                )}
              </Button>
            </div>

            {paymentError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium text-center bg-red-50/50 p-2 rounded-lg border border-red-100 dark:bg-red-950/15 dark:border-red-950/30">
                {paymentError}
              </p>
            )}

            <p className="mt-4 text-center text-[10px] text-zinc-400">
              By clicking, you will be redirected to Paystack&apos;s secure hosted checkout page.
            </p>
          </div>

          {/* Stock Issues warning inside summary */}
          {hasStockIssues && !isStockLoading && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-xs text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Stock verification warning: </span>
                Some items have stock conflicts. Please update cart quantities before checking out.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
