export const buttonClasses = {
  primary:
    "inline-flex min-h-11 items-center justify-center rounded-md bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600",
  secondary:
    "inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-stone-50",
  pill: "p-2 text-xl font-medium rounded-full border border-black hover:bg-rose-400/50 cursor-pointer",
  coffeeButton:
    "inline-flex h-13 w-13 items-center justify-center rounded-full border border-black hover:bg-rose-400/50 cursor-pointer",
  fileButton:
    "p-2 rounded-sm border border-gray-500 px-4 text-sm font-semibold shadow-sm hover:bg-amber-700/80 disabled:cursor-not-allowed disabled:opacity-60",
  cancelButton:
    "p-2 px-3 rounded-md border border-black hover:bg-rose-400/50 cursor-pointer",
} as const;

export const inputClasses =
  "min-h-11 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100";

export const textareaClasses =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100";
