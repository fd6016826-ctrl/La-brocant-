export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  condition: string;
  imageUrl: string;
  videoUrl?: string;
  size?: string;
  color?: string;
  quantity?: number;
  requestedQuantity?: number;
  additionalImages?: string[];
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  createdAt: string;
  isSold: boolean;
  buyerEmail?: string;
  buyerName?: string;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
  isSponsored?: boolean;
  descriptionStyle?: string;
}

export interface Message {
  id: string;
  senderEmail: string;
  senderName: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
}

export interface ChatThread {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImageUrl: string;
  sellerEmail: string;
  sellerName: string;
  buyerEmail: string;
  buyerName: string;
  lastMessageAt: string;
  messages: Message[];
  listingBuyerConfirmed?: boolean;
  listingSellerConfirmed?: boolean;
  listingIsSold?: boolean;
  listingBuyerEmail?: string;
  listingBuyerName?: string;
  requestedQuantity?: number;
}
