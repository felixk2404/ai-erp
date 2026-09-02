import { unstable_cache } from 'next/cache';
import { list } from './airtable';
import type { Product, ProductFields } from './types';

export const SERVICE = 'שירותים';

export const isService = (p: Product) => p.fields.Category === SERVICE;
export const inStock = (p: Product) => isService(p) || (p.fields.Stock ?? 0) > 0;
export const highlights = (p: Product) =>
  (p.fields.Highlights ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

export function related(p: Product, all: Product[], n = 3): Product[] {
  const others = all.filter((x) => x.id !== p.id);
  const score = (x: Product) => (x.fields.Category === p.fields.Category ? 0 : 2) + (inStock(x) ? 0 : 1);
  return others.sort((a, b) => score(a) - score(b)).slice(0, n);
}

export function categories(all: Product[]): string[] {
  const seen = new Set<string>();
  for (const p of all) if (p.fields.Category) seen.add(p.fields.Category);
  const list = [...seen].filter((c) => c !== SERVICE);
  return seen.has(SERVICE) ? [...list, SERVICE] : list;
}

const load = unstable_cache(
  async () => list<ProductFields>('Products', { filter: "{Sku}!=''", sort: [{ field: 'Name' }] }),
  ['products'],
  { revalidate: 60, tags: ['products'] },
);

export const getProducts = () => load();

export async function getProduct(sku: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.fields.Sku?.toUpperCase() === sku.toUpperCase()) ?? null;
}
