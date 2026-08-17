const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4040/api/v1';
const TOKEN_KEY = 'verimart_token';
const USER_KEY = 'verimart_user';

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Backend returns relative image paths like "/uploads/products/xxx.png".
// Resolve them to absolute URLs using the API origin so <img> tags load them.
function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/') || url.startsWith('/api/')) {
    const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    return `${origin}${url}`;
  }
  return url;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request<T = any>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data as T;
}

export async function registerUser(input: { name: string; email: string; password: string; role?: string; phone?: string }) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      phone: input.phone || `+${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      role: input.role || 'buyer',
    }),
  }, false);
}

export async function loginUser(email: string, password: string) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
  if (data?.token) setStoredAuth(data.token, data.user);
  return data;
}

export async function logoutUser() {
  clearStoredAuth();
}

export async function getProfile() {
  const data = await request('/getProfile');
  return data;
}

export async function updateProfile(payload: { name?: string; phone?: string; bio?: string; profilePic?: File | null }) {
  const formData = new FormData();
  if (payload.name) formData.append('name', payload.name);
  if (payload.phone) formData.append('phone', payload.phone);
  if (payload.bio !== undefined) formData.append('bio', payload.bio);
  if (payload.profilePic) formData.append('profilePic', payload.profilePic);
  return request('/updateProfile', {
    method: 'PATCH',
    body: formData,
  });
}

export async function getAllUsers() {
  const data = await request('/users');
  const list = Array.isArray(data?.users) ? data.users : [];
return list.map((u: any) => ({
    id: u._id || u.id,
    full_name: u.name || u.full_name || 'User',
    avatar_url: resolveImageUrl(u.profilePic || u.avatar_url),
    role: u.role || 'buyer',
    email: u.email || '',
    phone: u.phone || '',
    trust_score: Number(u.trustScore ?? u.trust_score ?? 0),
    warnings_count: Number(u.warningCount ?? u.warnings_count ?? 0),
    is_blocked: u.accountStatus === 'BLOCKED' || u.is_blocked || false,
    created_at: u.createdAt || u.created_at || new Date().toISOString(),
    updated_at: u.updatedAt || u.updated_at || new Date().toISOString(),
  }));
}

export async function updateUserStatus(id: string, isBlocked: boolean) {
  return request(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked }),
  });
}

const mapProductStatus = (status?: string) => {
  if (!status) return 'active';
  const upper = status.toUpperCase();
  if (upper === 'AVAILABLE' || upper === 'ACTIVE') return 'active';
  if (upper === 'RESERVED' || upper === 'PAUSED') return 'paused';
  return 'removed';
};

const mapProduct = (item: any) => ({
  id: item._id || item.id,
  seller_id: item.seller?._id || item.seller || item.seller_id,
  title: item.title,
  description: item.description,
  price: Number(item.sellingPrice ?? item.price ?? 0),
  stock: Number(item.stock ?? 1),
category: item.category || 'General',
  image_url: resolveImageUrl(item.images?.[0]?.url || item.image_url),
  status: mapProductStatus(item.status),
  created_at: item.createdAt || item.created_at || '',
  updated_at: item.updatedAt || item.updated_at || '',
  seller: item.seller
    ? {
        id: item.seller._id || item.seller.id || item.seller,
        full_name: item.seller.name || item.seller.full_name || 'Seller',
        avatar_url: resolveImageUrl(item.seller.profilePic || item.seller.avatar_url),
        trust_score: Number(item.seller.trustScore ?? item.seller.trust_score ?? 0),
      }
    : undefined,
});

export async function getProducts() {
  const data = await request('/product/getAllProduct');
  const list = Array.isArray(data?.products) ? data.products : [];
  return list.map(mapProduct);
}

export async function getMyProducts() {
  const data = await request('/product/my');
  const list = Array.isArray(data?.product) ? data.product : [];
  return list.map(mapProduct);
}

export async function createProduct(input: FormData) {
  return request('/product/create', {
    method: 'POST',
    body: input,
  });
}

export async function updateProduct(id: string, input: FormData) {
  return request(`/product/update/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteProduct(id: string) {
  return request(`/product/${id}`, { method: 'DELETE' });
}

export async function adminDeleteProduct(id: string) {
  return request(`/product/admin/${id}`, { method: 'DELETE' });
}

export async function deleteMessage(id: string) {
  return request(`/message/${id}`, { method: 'DELETE' });
}

export async function getConversationById(id: string) {
  const data = await request(`/conversation/${id}`);
  const item = data?.conversation;
  if (!item) return null;
  return {
    id: item._id || item.id,
    buyer_id: item.participants?.[0]?._id || item.buyer_id || '',
    seller_id: item.participants?.[1]?._id || item.seller_id || '',
    product_id: item.product?._id || item.product || '',
    created_at: item.createdAt || item.created_at || '',
    product: item.product
      ? {
          id: item.product._id || item.product.id || '',
          title: item.product.title,
          image_url: resolveImageUrl(item.product.images?.[0]?.url),
          price: Number(item.product.sellingPrice ?? item.product.price ?? 0),
        }
      : undefined,
    buyer: item.participants?.[0]
      ? {
          id: item.participants[0]._id || item.participants[0].id,
          full_name: item.participants[0].name || item.participants[0].full_name || 'Buyer',
          avatar_url: resolveImageUrl(item.participants[0].profilePic || item.participants[0].avatar_url),
        }
      : undefined,
    seller: item.participants?.[1]
      ? {
          id: item.participants[1]._id || item.participants[1].id,
          full_name: item.participants[1].name || item.participants[1].full_name || 'Seller',
          avatar_url: resolveImageUrl(item.participants[1].profilePic || item.participants[1].avatar_url),
        }
      : undefined,
  };
}

export async function clearAllNotifications() {
  return request('/notification/clearAllNotification', { method: 'PUT' });
}

export async function deleteNotification(id: string) {
  return request(`/notification/deleteNotification/${id}`, { method: 'PATCH' });
}

export async function getSellerReviews(sellerId: string) {
  const data = await request(`/review/seller/${sellerId}`);
  const list = Array.isArray(data?.reviews) ? data.reviews : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    rating: Number(item.rating ?? 0),
    comment: item.review || item.comment || '',
    buyer: item.buyer
      ? {
          full_name: item.buyer.name || item.buyer.full_name || 'Buyer',
          avatar_url: item.buyer.profilePic || item.buyer.avatar_url || null,
        }
      : undefined,
  }));
}

export async function getWarnings() {
  const data = await request('/warning/getMyWarnings');
  const list = Array.isArray(data?.warnings) ? data.warnings : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    seller_id: item.seller || item.seller_id || '',
    issued_by: item.issued_by || item.issuer || '',
    reason: item.reason || '',
    severity: (item.severity || 'minor').toLowerCase(),
    is_resolved: Boolean(item.is_resolved ?? false),
    created_at: item.createdAt || item.created_at || '',
    resolved_at: item.resolvedAt || item.resolved_at || null,
    issuer: item.issued_by
      ? {
          id: item.issued_by._id || item.issued_by.id || item.issued_by,
          full_name: item.issued_by.name || item.issued_by.full_name || 'Admin',
        }
      : undefined,
  }));
}

export async function createWarning(payload: { sellerId: string; reason: string; severity: 'minor' | 'major' | 'critical' }) {
  return request('/warning/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

const mapOrder = (item: any) => ({
  id: item._id || item.id,
  buyer_id: item.buyer?._id || item.buyer || item.buyer_id,
  seller_id: item.seller?._id || item.seller || item.seller_id,
  product_id: item.product?._id || item.product || item.product_id,
  conversation_id:
    (item.conversation_id?._id || item.conversation_id) || (item.conversation?._id || item.conversation) || null,
  quantity: Number(item.quantity ?? 1),
  unit_price: Number(item.agreedPrice ?? item.unit_price ?? 0),
  total: Number(item.agreedPrice ?? item.total ?? 0),
  status: (item.status || 'REQUESTED').toLowerCase(),
  created_at: item.createdAt || item.created_at || '',
  updated_at: item.updatedAt || item.updated_at || '',
  meeting: item.meeting || undefined,
  date: item.date ? new Date(item.date).toISOString().split('T')[0] : undefined,
  time: item.time || undefined,
  product: item.product
    ? {
        id: item.product._id || item.product.id || item.product,
        title: item.product.title,
        image_url: resolveImageUrl(item.product.images?.[0]?.url || item.product.image_url),
      }
    : undefined,
  buyer: item.buyer
    ? {
        id: item.buyer._id || item.buyer.id || item.buyer,
        full_name: item.buyer.name || item.buyer.full_name || 'Buyer',
        avatar_url: resolveImageUrl(item.buyer.profilePic || item.buyer.avatar_url),
      }
    : undefined,
  seller: item.seller
    ? {
        id: item.seller._id || item.seller.id || item.seller,
        full_name: item.seller.name || item.seller.full_name || 'Seller',
        avatar_url: resolveImageUrl(item.seller.profilePic || item.seller.avatar_url),
      }
    : undefined,
});

export async function createTransaction(payload: { product: string; agreedPrice: number; meeting?: string; date?: string; time?: string; paymentMethod?: string }) {
  return request('/transaction/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyTransactions() {
  const data = await request('/transaction/mytransaction');
  const list = Array.isArray(data?.transaction) ? data.transaction : [];
  return list.map(mapOrder);
}

export async function getTransactionById(id: string) {
  const data = await request(`/transaction/${id}`);
  const item = data?.transaction;
  return item ? mapOrder(item) : null;
}

export async function getAllTransactions() {
  const data = await request('/transaction/seeAll');
  const list = Array.isArray(data?.transactions) ? data.transactions : [];
  return list.map(mapOrder);
}

export async function updateTransactionStatus(
  id: string,
  status: 'accept' | 'reject' | 'meeting' | 'buyer-confirm' | 'seller',
  data?: { meeting?: string; date?: string; time?: string },
) {
  const path = {
    accept: `/transaction/accept/${id}`,
    reject: `/transaction/reject/${id}`,
    meeting: `/transaction/meeting/${id}`,
    'buyer-confirm': `/transaction/buyer-confirm/${id}`,
    seller: `/transaction/seller/${id}`,
  }[status];
  return request(path!, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function createConversation(receiverId: string, productId: string) {
  return request('/conversation/createConversation', {
    method: 'POST',
    body: JSON.stringify({ receiverId, productId }),
  });
}

export async function getConversations() {
  const data = await request('/conversation/getMyConversation');
  const list = Array.isArray(data?.conversation) ? data.conversation : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    buyer_id: item.participants?.[0]?._id || item.buyer_id || '',
    seller_id: item.participants?.[1]?._id || item.seller_id || '',
    product_id: item.product?._id || item.product || '',
    created_at: item.createdAt || item.created_at || '',
product: item.product
      ? {
          id: item.product._id || item.product.id || '',
          title: item.product.title,
          image_url: resolveImageUrl(item.product.images?.[0]?.url),
          price: Number(item.product.sellingPrice ?? item.product.price ?? 0),
        }
      : undefined,
    buyer: item.participants?.[0]
      ? {
          id: item.participants[0]._id || item.participants[0].id,
          full_name: item.participants[0].name || item.participants[0].full_name || 'Buyer',
          avatar_url: resolveImageUrl(item.participants[0].profilePic || item.participants[0].avatar_url),
        }
      : undefined,
    seller: item.participants?.[1]
      ? {
          id: item.participants[1]._id || item.participants[1].id,
          full_name: item.participants[1].name || item.participants[1].full_name || 'Seller',
          avatar_url: resolveImageUrl(item.participants[1].profilePic || item.participants[1].avatar_url),
        }
      : undefined,
  }));
}

export async function getMessages(conversationId: string) {
  const data = await request(`/message/getAllMessage/${conversationId}`);
  const list = Array.isArray(data?.messages) ? data.messages : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    conversation_id: conversationId,
    sender_id: item.sender?._id || item.sender || '',
    content: item.text || item.content || '',
    read_at: item.isSeen ? new Date().toISOString() : null,
    created_at: item.createdAt || item.created_at || '',
  }));
}

export async function sendMessage(conversationId: string, content: string) {
  const data = await request('/message/createMessage', {
    method: 'POST',
    body: JSON.stringify({ conversationId, text: content }),
  });
  return data;
}

export async function getNotifications() {
  const data = await request('/notification/getMyNotification');
  const list = Array.isArray(data?.notifications) ? data.notifications : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    user_id: item.user || '',
    type: (item.type || 'system').toLowerCase(),
    title: item.title || 'Notification',
    body: item.message || item.body || '',
    link: item.link || null,
    is_read: Boolean(item.isRead ?? item.is_read),
    created_at: item.createdAt || item.created_at || '',
  }));
}

export async function createNotification(payload: { user: string; title: string; body: string; type?: string; link?: string }) {
  return request('/notification/createNotification', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function markNotificationRead(id: string) {
  return request(`/notification/markAsRead/${id}`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return request('/notification/markAll', { method: 'PUT' });
}

export async function getReviews(productId: string) {
  const data = await request(`/review/ProductReview/${productId}`);
  const list = Array.isArray(data?.reviews) ? data.reviews : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    rating: Number(item.rating ?? 0),
    comment: item.review || item.comment || '',
    buyer: item.buyer
      ? {
          full_name: item.buyer.name || item.buyer.full_name || 'Buyer',
          avatar_url: item.buyer.profilePic || item.buyer.avatar_url || null,
        }
      : undefined,
  }));
}

export async function createReview(payload: { product: string; rating: number; review: string; productConditionMatched?: boolean; sellerBehavior?: string; wouldRecommend?: boolean }) {
  return request('/review/createReview', {
    method: 'POST',
    body: JSON.stringify({
      product: payload.product,
      rating: payload.rating,
      review: payload.review,
      productConditionMatched: payload.productConditionMatched ?? true,
      sellerBehavior: payload.sellerBehavior || 'Good',
      wouldRecommend: payload.wouldRecommend ?? true,
    }),
  });
}

export async function updateReview(id: string, payload: { product: string; rating: number; review: string }) {
  return request(`/review/updateReview/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(id: string) {
  return request(`/review/deleteReview/${id}`, { method: 'DELETE' });
}

export async function getMyReviews() {
  const data = await request('/review/myReview');
  const list = Array.isArray(data?.reviews) ? data.reviews : [];
  return list.map((item: any) => ({
    id: item._id || item.id,
    product_id: item.product?._id || item.product || '',
    seller_id: item.seller?._id || item.seller || '',
    rating: Number(item.rating ?? 0),
    comment: item.review || item.comment || '',
    created_at: item.createdAt || item.created_at || '',
  }));
}

export async function createReport(payload: { reportedUser: string; product: string; reason: string; description: string }) {
  return request('/report/createReport', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

const mapReport = (item: any) => ({
  id: item._id || item.id,
  reporter_id: item.reporter?._id || item.reporter || '',
  target_type: item.product ? 'product' : 'user',
  target_id: item.product?._id || item.product || item.reportedUser || '',
  reason: item.reason || 'Reported',
  description: item.description || '',
  status: (item.status || 'PENDING').toLowerCase(),
  admin_note: item.adminRemark || item.admin_note || null,
  created_at: item.createdAt || item.created_at || '',
  resolved_at: item.resolvedAt || item.resolved_at || null,
  reporter: item.reporter
    ? {
        id: item.reporter._id || item.reporter.id || item.reporter,
        full_name: item.reporter.name || item.reporter.full_name || 'User',
        avatar_url: item.reporter.profilePic || item.reporter.avatar_url || null,
        role: item.reporter.role || 'buyer',
      }
    : undefined,
  reported_user: item.reportedUser
    ? {
        id: item.reportedUser._id || item.reportedUser.id || item.reportedUser,
        full_name: item.reportedUser.name || item.reportedUser.full_name || 'User',
        avatar_url: item.reportedUser.profilePic || item.reportedUser.avatar_url || null,
      }
    : undefined,
});

export async function getReports() {
  const data = await request('/report/getAllReport');
  return Array.isArray(data?.reports) ? data.reports.map(mapReport) : [];
}

export async function getMyReports() {
  const data = await request('/report/getMyReport/me');
  return Array.isArray(data?.reports) ? data.reports.map(mapReport) : [];
}

export async function resolveReport(id: string, adminNote: string) {
  return request(`/report/resolveReport/${id}`, {
    method: 'POST',
    body: JSON.stringify({ adminRemark: adminNote }),
  });
}

export async function rejectReport(id: string, adminNote: string) {
  return request(`/report/rejectReport/${id}`, {
    method: 'POST',
    body: JSON.stringify({ adminRemark: adminNote }),
  });
}
