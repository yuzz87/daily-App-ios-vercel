const BASE_PATH = process.env.NODE_ENV === "production" ? "/PWA-Test-daily-v1" : "";

export function publicUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}
