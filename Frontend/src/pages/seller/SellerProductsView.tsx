import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { ProductImage, StatusBadge, EmptyState } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { createProduct, deleteProduct, getMyProducts, updateProduct } from '@/lib/api';
import type { Product, ProductStatus } from '@/lib/types';

const categories = ['Mobiles', 'Laptops', 'Electronics', 'Vehicles', 'Furniture', 'Fashion', 'Books', 'Sports', 'Room', 'Others'];

export function SellerProductsView() {
  const { profile } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!profile) return;
    const data = await getMyProducts();
    setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [profile?.id]);

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(p.id);
      toast('Product deleted', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to delete product', 'error');
    }
  };

  const toggleStatus = async (p: Product) => {
    const next: ProductStatus = p.status === 'active' ? 'paused' : 'active';
    const formData = new FormData();
    formData.append('status', next === 'active' ? 'AVAILABLE' : 'RESERVED');
    try {
      await updateProduct(p.id, formData);
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update status', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-600">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {loading ? (
        <div className="card p-6 animate-pulse">Loading...</div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No products yet"
          description="Add your first product to start selling on VeriMart."
          action={<button onClick={() => setCreating(true)} className="btn-primary">Add product</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="relative aspect-square">
                <ProductImage url={p.image_url} title={p.title} />
                <div className="absolute right-2 top-2"><StatusBadge status={p.status} /></div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-semibold text-ink-950">{p.title}</h3>
                <p className="mt-0.5 text-xs text-ink-500">{p.category} · {p.stock} in stock</p>
                <p className="mt-2 text-lg font-bold text-ink-950">{formatPrice(p.price)}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setEditing(p)} className="btn-secondary flex-1 py-2 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleStatus(p)} className="btn-ghost flex-1 py-2 text-xs">
                    {p.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => remove(p)} className="btn-ghost py-2 text-xs text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductForm
          product={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(product?.title ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? '');
  const [stock, setStock] = useState(product?.stock?.toString() ?? '1');
const [category, setCategory] = useState(product?.category ?? 'Others');
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    // Load a local preview
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
    setImageFile(file);
    setUploading(false);
  };

  const save = async () => {
    if (!title.trim() || !price) { toast('Title and price are required', 'error'); return; }
    setSaving(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('condition', 'Good');
    formData.append('sellingPrice', String(parseFloat(price)));
formData.append('brand', 'Brand');
    formData.append('model', 'Model');
    formData.append('location', JSON.stringify({ city: 'Unknown', state: 'Unknown' }));
    formData.append('status', 'AVAILABLE');
    // Append the actual image file for Cloudinary upload (if a new one was selected)
    if (imageFile) {
      formData.append('images', imageFile);
    }
    try {
      if (product) {
        await updateProduct(product.id, formData);
        toast('Product updated', 'success');
      } else {
        await createProduct(formData);
        toast('Product created', 'success');
      }
      onSaved();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to save product', 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={product ? 'Edit product' : 'Add product'} size="lg">
      <div className="space-y-4">
        {/* Image */}
        <div>
          <label className="label">Product image</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 transition hover:border-brand-400 hover:bg-brand-50"
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40 opacity-0 transition group-hover:opacity-100">
                  <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-800">Change image</span>
                </div>
              </>
            ) : uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
            ) : (
              <div className="text-center text-ink-400">
                <Upload className="mx-auto h-6 w-6" />
                <p className="mt-2 text-xs">Click to upload</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {imageUrl && (
            <button onClick={() => setImageUrl(null)} className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
              <X className="h-3 w-3" /> Remove image
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Wireless Headphones" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-20 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." />
          </div>
          <div>
            <label className="label">Price ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.99" />
          </div>
          <div>
            <label className="label">Stock</label>
            <input className="input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} className="btn-primary" disabled={saving || uploading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
