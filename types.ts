
export enum View {
  HOME = 'home',
  AVATAR = 'avatar',
  VIRTUAL_FIT = 'virtual_fit',
  FEED = 'feed',
  SETTINGS = 'settings',
  SUBSCRIPTION = 'subscription',
  POST_DETAIL = 'post_detail',

  USER_PROFILE = 'user_profile',
  WARDROBE = 'wardrobe',
  SHOP = 'shop',
  SHOP_DETAIL = 'shop_detail',
  AVATAR_SETTINGS = 'avatar_settings',
  INSTRUCTIONS = 'instructions',
  NOT_FOUND = 'not_found'
}

export interface User {
  id: number;
  name: string;
  nickname: string;
  email: string;
  bio?: string;
  avatarUrl?: string; // from gravatar or local
  tokens: number;
  daily_generations_count: number;
  last_generation_date?: string;
  subscription?: Subscription;
}

export interface Subscription {
  id: number;
  status: string;
  starts_at: string;
  expires_at: string;
  subscription_plan_id: number;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  period: string;
  photos_per_day: number;
  features: string[];
}

export interface TokenPackage {
  id: number;
  name: string;
  tokens: number;
  price: number;
  currency: string;
}

export interface UserStats {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
}

export interface DigitalTwin {
  id: string;
  name: string;
  referenceImages: string[];
  stats: UserStats;
  generatedAvatarUrl?: string; // Generated avatar icon
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  imageUrl: string;
  storeUrl: string;
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  externalUrl?: string;
  description?: string;
  category?: string;
  postsCount?: number;
}

// Результат поиска магазинов
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

// Результат поиска товаров (с картинками)
export interface ProductSearchResult {
  id: string;
  imageUrl: string;
  title: string;
  url: string;
  domain: string;
  price?: string;
}

export interface PostMedia {
  url: string;
  type: 'image' | 'video';
}

export interface Post {
  id: string;
  imageUrl: string; // Основное превью
  media?: PostMedia[]; // Список кадров для переключения
  author: string;
  likes: number;
  isPrivate: boolean;
  tags: string[];
  title?: string;
  shop?: Shop;
}

export interface PostGroup {
  id: string;
  name: string;
  posts: Post[];
  createdAt: number;
}

export enum Scenario {
  WALKING = 'Walking'
}
