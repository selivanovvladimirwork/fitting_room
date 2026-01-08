
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
  AVATAR_SETTINGS = 'avatar_settings'
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
  logoUrl?: string;
  externalUrl?: string;
  description?: string;
  postsCount?: number;
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
  WALKING = 'Walking',
  CAR_ENTRY = 'Car Entry',
  SPORT = 'Sport',
  STREET_INTERACTION = 'Street Deco'
}
