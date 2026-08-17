export type Role = 'buyer' | 'seller' | 'admin';

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  trust_score: number;
  warnings_count: number;
  is_blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductStatus = 'active' | 'paused' | 'removed';

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  seller?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'trust_score'>;
};

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  created_at: string;
  product?: Pick<Product, 'id' | 'title' | 'image_url' | 'price'>;
  buyer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  seller?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type OrderStatus =
  | 'requested'
  | 'accepted'
  | 'meeting_scheduled'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'refunded';

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  conversation_id: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  meeting?: string;
  date?: string;
  time?: string;
  product?: Pick<Product, 'id' | 'title' | 'image_url'>;
  buyer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  seller?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

export type Review = {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

export type NotificationType = 'chat' | 'transaction' | 'warning' | 'system' | 'report' | 'review';

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: 'product' | 'user';
  target_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected' | 'open' | 'reviewing' | 'dismissed';
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>;
  reported_user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

export type Warning = {
  id: string;
  seller_id: string;
  issued_by: string;
  reason: string;
  severity: 'minor' | 'major' | 'critical';
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  issuer?: Pick<Profile, 'id' | 'full_name'>;
};
