import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Star, Flag } from 'lucide-react';
import { ProductImage, Stars, TrustBadge } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { createReport, getProducts, getReviews } from '@/lib/api';
import type { Product } from '@/lib/types';

const reportReasons = ['Fake Product', 'Scam', 'Wrong Description', 'Duplicate Listing', 'Abusive Behaviour', 'Spam', 'Other'];

const categories = ['All', 'Mobiles', 'Laptops', 'Electronics', 'Vehicles', 'Furniture', 'Fashion', 'Books', 'Sports', 'Room', 'Others'];

export function BrowseView({ onOpen }: { onOpen: (product: Product) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'new' | 'price_asc' | 'price_desc' | 'rating'>('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

 const load = async () => {
    setLoading(true);
    const allProducts: Product[] = await getProducts();
    const filtered = allProducts.filter((p) => {
      if (p.status === 'removed') return false;
      const matchesQuery = !query.trim() || `${p.title} ${p.description}`.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = category === 'All' || p.category === category;
      return matchesQuery && matchesCategory;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'rating') return 0;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setProducts(sorted);
    setLoading(false);
    setSearched(true);
  };

  // load ratings per product for sort by rating
  const sorted = useMemo(() => {
    if (sort !== 'rating') return products;
    return [...products];
  }, [products, sort]);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-10"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <select className="input sm:w-44" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="new">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top rated</option>
          </select>
          <button onClick={load} className="btn-primary sm:w-32">
            <SlidersHorizontal className="h-4 w-4" /> Search
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setTimeout(load, 0);
              }}
              className={`chip ${category === c ? 'border-brand-300 bg-brand-50 text-brand-700' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-square animate-pulse bg-ink-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">
            {searched ? 'No products match your search.' : 'No products available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="group card overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="relative aspect-square overflow-hidden">
                <ProductImage url={p.image_url} title={p.title} className="transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-2 top-2 badge bg-white/90 text-ink-700 backdrop-blur">
                  {p.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-semibold text-ink-950">{p.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{p.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-ink-950">{formatPrice(p.price)}</span>
                  {p.seller && <TrustBadge score={p.seller.trust_score} size="sm" />}
                </div>
                {p.seller && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                    <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    by {p.seller.full_name}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetailModal({
  product,
  onClose,
  onChat,
  onBuy,
}: {
  product: Product | null;
  onClose: () => void;
  onChat: (product: Product) => void;
  onBuy: (product: Product) => void;
}) {
  const toast = useToast();
  const [reviews, setReviews] = useState<{ rating: number; comment: string; buyer?: { full_name: string; avatar_url: string | null } }[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!product) { setReviews([]); return; }
    getReviews(product.id).then(setReviews);
  }, [product]);

  if (!product) return null;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const submitReport = async () => {
    if (!product.seller) return;
    setReporting(true);
    try {
      await createReport({
        reportedUser: product.seller.id,
        product: product.id,
        reason: reportReason,
        description: reportDesc || reportReason,
      });
      toast('Report submitted. Our team will review it.', 'success');
      setReportOpen(false);
      setReportDesc('');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to submit report', 'error');
    }
    setReporting(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in" onClick={onClose}>
        <div
          className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-slide-up sm:rounded-2xl scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid sm:grid-cols-2">
            <div className="aspect-square sm:aspect-auto">
              <ProductImage url={product.image_url} title={product.title} />
            </div>
            <div className="p-6">
              <span className="badge bg-ink-100 text-ink-600">{product.category}</span>
              <h2 className="mt-3 text-xl font-bold text-ink-950">{product.title}</h2>
              <p className="mt-2 text-sm text-ink-600">{product.description}</p>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-bold text-ink-950">{formatPrice(product.price)}</span>
                <span className="badge bg-brand-100 text-brand-700">{product.stock} in stock</span>
              </div>

              {product.seller && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
                    {product.seller.full_name?.[0] ?? 'S'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">{product.seller.full_name}</p>
                    <TrustBadge score={product.seller.trust_score} size="sm" />
                  </div>
                </div>
              )}

              {reviews.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <Stars rating={avgRating} />
                    <span className="text-xs text-ink-500">{avgRating.toFixed(1)} ({reviews.length})</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <button onClick={() => onChat(product)} className="btn-secondary flex-1">Chat with seller</button>
                <button onClick={() => onBuy(product)} className="btn-primary flex-1">Buy now</button>
              </div>
              <button
                onClick={() => setReportOpen(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                <Flag className="h-3.5 w-3.5" /> Report this product / seller
              </button>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="border-t border-ink-200 p-6">
              <h3 className="text-sm font-semibold text-ink-900">Recent reviews</h3>
              <div className="mt-3 space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="rounded-xl bg-ink-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-700">{r.buyer?.full_name ?? 'Buyer'}</span>
                      <Stars rating={r.rating} size={12} />
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm text-ink-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report listing">
        <div className="space-y-4">
          <div className="rounded-xl bg-ink-50 p-3">
            <p className="text-sm font-medium text-ink-900">{product.title}</p>
            <p className="text-xs text-ink-500">Seller: {product.seller?.full_name}</p>
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              {reportReasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Details</label>
            <textarea
              className="input min-h-20 resize-none"
              placeholder="Describe the issue..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
            <button onClick={() => setReportOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={submitReport} className="btn-primary" disabled={reporting}>
              {reporting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
