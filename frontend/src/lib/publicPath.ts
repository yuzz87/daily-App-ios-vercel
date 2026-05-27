export const BASE_PATH = "";

export function publicUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}
