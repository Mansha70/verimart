// Image upload is handled by the backend via Cloudinary (multer → multer-storage-cloudinary).
// The frontend sends images as FormData with the "images" field — no separate upload needed.
// This file is kept as a re-export for backward compatibility.

export async function uploadProductImage(
  _file: File,
  _sellerId: string,
): Promise<string | null> {
  // _file and _sellerId are unused — we keep them for API compatibility
  void _file;
  void _sellerId;
  console.warn(
    '[VeriMart] uploadProductImage is deprecated. ' +
    'Images are uploaded via the backend Cloudinary integration. ' +
    'Use createProduct(formData) directly with the file appended as "images" field.'
  );
  return null;
}

