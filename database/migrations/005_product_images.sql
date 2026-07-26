CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  public_url TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK(byte_size > 0 AND byte_size <= 2097152),
  alt_text TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX product_images_lookup
  ON product_images(tenant_id, product_id, is_primary DESC, created_at);

CREATE UNIQUE INDEX product_images_one_primary
  ON product_images(product_id)
  WHERE is_primary = TRUE;

