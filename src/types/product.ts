// /types/product.ts
export type Product = {
  id: string;
  title: string;
  category: string;
  pricePhp?: number | null;
  rating?: number | null;
  store?: string | null;
  imageUrl: string;
  affiliateUrl: string; // external, will open in new tab
  blurb?: string;
  ownerUid: string;
  ownerName?: string | null;
  status: "draft" | "pending" | "approved" | "rejected";
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
};
