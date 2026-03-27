export interface ProductData {
  billCode: string;
  productCode: string;
  category: string;
  subCategory: string;
  name: string;
  msrp: number;
  netPrice?: number;
  orderFee?: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  description?: string;
}

export interface CartItemData {
  id: string;
  product: ProductData & { slug: string };
  imageUrl: string;
  quantity: number;
}

export type ProductCategory =
  | "Small Format Prints"
  | "Large Format Prints"
  | "Wall Décor"
  | "Albums/Books"
  | "Drinkware"
  | "Cards"
  | "Press Prints"
  | "Puzzles"
  | "Home & Office"
  | "Ornaments"
  | "Textiles"
  | "Accessories"
  | "Calendars";
