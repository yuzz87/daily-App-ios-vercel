export const buttonClasses = {
  primary:
    "inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600",
  secondary:
    "inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-stone-50",
} as const;

export const inputClasses =
  "min-h-11 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100";

export const textareaClasses =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100";
