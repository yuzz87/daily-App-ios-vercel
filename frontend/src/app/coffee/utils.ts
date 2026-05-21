const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function buildImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  if (!API_BASE_URL) return imageUrl;
  return `${new URL(API_BASE_URL).origin}${imageUrl}`;
}

export function formatDate(value: string | null, fallback = "-"): string {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function nullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await res.json();
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join("\n");
    }
    if (typeof data.error === "string") return data.error;
  } catch {
    return fallback;
  }
  return fallback;
}
