import { useEffect, useState } from 'react';
import { Search, Trash2, Package } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ProductImage, StatusBadge, EmptyState, TrustBadge } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/format';
import { adminDeleteProduct, getProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

export function AdminProductsView() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

const load = async () => {
    const items: Product[] = await getProducts();
    const filtered = query.trim() ? items.filter((p: Product) => p.title.toLowerCase().includes(query.trim().toLowerCase())) : items;
    setProducts(filtered);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

const remove = async (p: Product) => {
    if (!confirm(`Remove "${p.title}" from the marketplace?`)) return;
    try {
      await adminDeleteProduct(p.id);
      toast('Product removed', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to remove product', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Search products..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          </div>
          <button onClick={load} className="btn-primary sm:w-28">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="card animate-pulse p-6">Loading...</div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Listed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {products.map((p) => (
                  <tr key={p.id} className="transition hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"><ProductImage url={p.image_url} title={p.title} /></div>
                        <div className="min-w-0"><p className="truncate font-medium text-ink-900">{p.title}</p><p className="text-xs text-ink-500">{p.category}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-700">{p.seller?.full_name}</p>
                      {p.seller && <TrustBadge score={p.seller.trust_score} size="sm" />}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(p)} className="btn-ghost py-1.5 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
