export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type OrderStatus = 'pending' | 'paid' | 'revealed' | 'shipped' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface PoolItem {
  id: string;
  blindBoxId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  rarity: Rarity;
  weight: number;
  stock: number;
  totalStock: number;
}

export interface BlindBox {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  items?: PoolItem[];
}

export interface Order {
  id: string;
  userId: string;
  blindBoxId: string;
  poolItemId?: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  revealedAt?: string;
  createdAt: string;
  blindBox?: BlindBox;
  revealedItem?: PoolItem;
}

export interface AuthResponse {
  token: string;
  user: User;
}
