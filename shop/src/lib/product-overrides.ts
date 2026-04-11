import fs from "fs";
import path from "path";

export interface ProductOverride {
  msrp?: number;
  customImage?: string; // relative path under /images/products/
}

export type OverridesMap = Record<string, ProductOverride>; // keyed by billCode

const OVERRIDES_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "product-overrides.json"
);

export function readOverrides(): OverridesMap {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const raw = fs.readFileSync(OVERRIDES_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read product overrides:", e);
  }
  return {};
}

export function writeOverrides(overrides: OverridesMap): void {
  const dir = path.dirname(OVERRIDES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), "utf-8");
}

export function getOverride(billCode: string): ProductOverride | undefined {
  const overrides = readOverrides();
  return overrides[billCode];
}

export function setOverride(
  billCode: string,
  override: ProductOverride
): void {
  const overrides = readOverrides();
  overrides[billCode] = { ...overrides[billCode], ...override };
  writeOverrides(overrides);
}

export function removeOverride(billCode: string): void {
  const overrides = readOverrides();
  delete overrides[billCode];
  writeOverrides(overrides);
}
