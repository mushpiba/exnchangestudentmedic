// Medicines students used at home, with their active ingredients, so the app can point to Korean OTC products
// that contain the same ones. Draft data — a pharmacist must review it before the pilot.
// One entry per specific product: brands sell different formulas under one name (Panadol vs Panadol Extra),
// and the same name can differ between countries, so each entry names the country version its source describes.
import data from "./foreign-meds.json";

export type ForeignIngredient = {
  /** Key in INGREDIENTS when NARU can explain it; absent for ingredients only known from foreign products. */
  id?: string;
  /** International non-proprietary name, in Latin script. */
  inn: string;
  amount?: string;
};

export type ForeignProduct = {
  key: string;
  /** Name as printed on the pack. */
  name: string;
  /** Other spellings students type: local scripts and transliterations. */
  match: string[];
  family: string;
  countries: string[];
  ingredients: ForeignIngredient[];
  source: string;
  note?: string;
};

export const FOREIGN: ForeignProduct[] = data.products;
export const FOREIGN_CHECKED: string = data.checkedAt;
