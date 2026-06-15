import type { CoffeeBean } from "./types";

const STORAGE_KEY = "demo_coffee_beans";

export type CoffeeBeanAnalyzeResult = {
  brand: string | null;
  code: string | null;
  country: string | null;
  description_ja: string | null;
  elevation: string | null;
  farm: string | null;
  farmer: string | null;
  flavor_notes: string[];
  is_limited: boolean;
  name: string | null;
  name_ja: string | null;
  process: string | null;
  raw_text: string | null;
  region: string | null;
  roast_level: string | null;
  status: "confirmed";
  variety: string | null;
};

export const demoAnalyzeResult: CoffeeBeanAnalyzeResult = {
  brand: "PostCoffee",
  code: "CO-1234",
  country: "ETHIOPIA",
  description_ja:
    "明るい柑橘感と紅茶のような余韻を持つ、デモ用の解析結果です。",
  elevation: "1,900m",
  farm: null,
  farmer: null,
  flavor_notes: ["Citrus", "Floral", "Tea-like"],
  is_limited: false,
  name: "Ethiopia Guji",
  name_ja: "エチオピア グジ",
  process: "Washed",
  raw_text: "Demo analysis result. No external AI API was called.",
  region: "Guji",
  roast_level: "LIGHT ROAST",
  status: "confirmed",
  variety: null,
};

export function isDemoCoffeePath(pathname: string): boolean {
  return pathname === "/demo/coffee" || pathname.startsWith("/demo/coffee/");
}

export function getDemoCoffeeBeans(): CoffeeBean[] {
  if (typeof window === "undefined") return sampleCoffeeBeans();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleCoffeeBeans();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return sampleCoffeeBeans();

    return parsed.filter(isCoffeeBean);
  } catch {
    return sampleCoffeeBeans();
  }
}

export function getDemoCoffeeBean(id: string): CoffeeBean | null {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  return getDemoCoffeeBeans().find((bean) => bean.id === numericId) ?? null;
}

export function saveDemoCoffeeBeans(beans: CoffeeBean[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(beans));
}

export function upsertDemoCoffeeBean(bean: CoffeeBean): void {
  const beans = getDemoCoffeeBeans();
  const existingIndex = beans.findIndex((current) => current.id === bean.id);

  if (existingIndex >= 0) {
    beans[existingIndex] = bean;
  } else {
    beans.unshift(bean);
  }

  saveDemoCoffeeBeans(beans);
}

export function deleteDemoCoffeeBean(id: number): void {
  saveDemoCoffeeBeans(getDemoCoffeeBeans().filter((bean) => bean.id !== id));
}

export function createDemoCoffeeBeanFromAnalysis(
  result: CoffeeBeanAnalyzeResult,
): CoffeeBean {
  const now = new Date().toISOString();
  const bean: CoffeeBean = {
    id: nextCoffeeBeanId(),
    image_url: null,
    brand: result.brand,
    code: result.code,
    roast_level: result.roast_level,
    name: result.name,
    country: result.country,
    name_ja: result.name_ja,
    description_ja: result.description_ja,
    flavor_notes: result.flavor_notes,
    region: result.region,
    process: result.process,
    variety: result.variety,
    elevation: result.elevation,
    farmer: result.farmer,
    farm: result.farm,
    is_limited: result.is_limited,
    status: result.status,
    created_at: now,
    updated_at: now,
  };

  upsertDemoCoffeeBean(bean);
  return bean;
}

function sampleCoffeeBeans(): CoffeeBean[] {
  const now = new Date().toISOString();

  return [
    {
      id: 1,
      image_url: null,
      brand: "PostCoffee",
      code: "ET-2026",
      roast_level: "LIGHT ROAST",
      name: "Ethiopia Yirgacheffe",
      country: "ETHIOPIA",
      name_ja: "エチオピア イルガチェフェ",
      description_ja:
        "柑橘の明るさと花の香りが特徴の、デモ用コーヒー豆データです。",
      flavor_notes: ["Lemon", "Jasmine", "Black tea"],
      region: "Yirgacheffe",
      process: "Washed",
      variety: null,
      elevation: "1,900m",
      farmer: null,
      farm: null,
      is_limited: false,
      status: "confirmed",
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      image_url: null,
      brand: "Local Roasters",
      code: "CO-7788",
      roast_level: "MEDIUM ROAST",
      name: "Colombia Huila",
      country: "COLOMBIA",
      name_ja: "コロンビア ウィラ",
      description_ja:
        "ベリー感とチョコレート感を確認できる、デモ用の中煎りデータです。",
      flavor_notes: ["Berry", "Chocolate", "Round"],
      region: "Huila",
      process: "Natural",
      variety: null,
      elevation: null,
      farmer: null,
      farm: null,
      is_limited: false,
      status: "confirmed",
      created_at: now,
      updated_at: now,
    },
  ];
}

function nextCoffeeBeanId(): number {
  return Math.max(0, ...getDemoCoffeeBeans().map((bean) => bean.id)) + 1;
}

function isCoffeeBean(value: unknown): value is CoffeeBean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CoffeeBean).id === "number"
  );
}
