/*
# VeriMart initial schema

1. Overview
VeriMart is a multi-role marketplace with three user roles: buyer, seller, admin.
This migration creates the full data model and row-level security policies.

2. New Tables
- `profiles` — extends auth.users with role, display name, avatar, trust score, blocked flag.
- `products` — seller listings with title, description, price, stock, image, status.
- `conversations` — one-to-one chat scoped to (buyer, seller, product).
- `messages` — individual chat messages within a conversation.
- `orders` — purchase records linking buyer, seller, product, price, status.
- `reviews` — buyer reviews of products/sellers with rating + comment.
- `notifications` — user-facing notifications (chat, transaction, warning, system).
- `reports` — admin-reviewable reports filed against products or users.
- `warnings` — admin-issued warnings to sellers; count drives trust score / blocking.

3. Security
- RLS enabled on every table.
- Role stored in auth.users raw_app_meta_data (user-immutable). A helper function
  `current_role()` reads it from auth.jwt() for use in policies.
- Profiles: each user reads/updates own row; admins read all; sellers/buyers read public profile columns.
- Products: public read; only owner seller or admin can insert/update/delete.
- Conversations: only the two participants (or admin) can read/insert.
- Messages: only conversation participants (or admin) can read/insert.
- Orders: buyer & seller of the order can read; buyer can insert (create purchase);
  seller can update status; admin can read all.
- Reviews: public read; only the buyer who placed an order can review that order.
- Notifications: owner-only read/update; admin/system insert via service role.
- Reports: buyers/sellers can insert; admin-only read/update.
- Warnings: admin-only insert/read; seller can read their own warnings.

4. Notes
- Owner columns default to auth.uid() so client inserts that omit them still satisfy RLS.
- current_role() uses auth.jwt() -> raw_app_meta_data -> role.
- Trust score maintained via trigger when warnings added or resolved.
*/

-- ---------- helper: current role from JWT ----------
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role')::text,
    'buyer'
  );
$$;

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  trust_score int NOT NULL DEFAULT 100 CHECK (trust_score BETWEEN 0 AND 100),
  warnings_count int NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND public.current_role() <> 'admin');

-- admin can update any profile (block/unblock, trust score)
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL DEFAULT 'General',
  image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- everyone authenticated can browse active products; sellers see own; admin sees all
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select"
  ON public.products FOR SELECT TO authenticated
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR public.current_role() = 'admin'
  );

DROP POLICY IF EXISTS "products_insert_seller" ON public.products;
CREATE POLICY "products_insert_seller"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND public.current_role() IN ('seller','admin')
  );

DROP POLICY IF EXISTS "products_update_owner_or_admin" ON public.products;
CREATE POLICY "products_update_owner_or_admin"
  ON public.products FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.current_role() = 'admin')
  WITH CHECK (seller_id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "products_delete_owner_or_admin" ON public.products;
CREATE POLICY "products_delete_owner_or_admin"
  ON public.products FOR DELETE TO authenticated
  USING (seller_id = auth.uid() OR public.current_role() = 'admin');

-- ---------- conversations ----------
-- unique chat per (buyer, seller, product)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, seller_id, product_id),
  CHECK (buyer_id <> seller_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid() OR seller_id = auth.uid() OR public.current_role() = 'admin'
  );

DROP POLICY IF EXISTS "conversations_insert_participants" ON public.conversations;
CREATE POLICY "conversations_insert_participants"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    (buyer_id = auth.uid() OR seller_id = auth.uid())
    AND public.current_role() <> 'admin'
  );

-- ---------- messages ----------
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid() OR public.current_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;
CREATE POLICY "messages_insert_participants"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_read" ON public.messages;
CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_parties" ON public.orders;
CREATE POLICY "orders_select_parties"
  ON public.orders FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid() OR seller_id = auth.uid() OR public.current_role() = 'admin'
  );

DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
CREATE POLICY "orders_insert_buyer"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() AND public.current_role() = 'buyer');

DROP POLICY IF EXISTS "orders_update_seller_or_admin" ON public.orders;
CREATE POLICY "orders_update_seller_or_admin"
  ON public.orders FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.current_role() = 'admin')
  WITH CHECK (seller_id = auth.uid() OR public.current_role() = 'admin');

-- ---------- reviews ----------
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "reviews_insert_buyer" ON public.reviews;
CREATE POLICY "reviews_insert_buyer"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = reviews.order_id
        AND o.buyer_id = auth.uid()
        AND o.status IN ('delivered','paid','shipped')
    )
  );

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own"
  ON public.reviews FOR DELETE TO authenticated
  USING (buyer_id = auth.uid());

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('chat','transaction','warning','system','report','review')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_insert_own_or_admin"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------- reports ----------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('product','user')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_admin_or_own" ON public.reports;
CREATE POLICY "reports_select_admin_or_own"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "reports_insert_any" ON public.reports;
CREATE POLICY "reports_insert_any"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- ---------- warnings ----------
CREATE TABLE IF NOT EXISTS public.warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','major','critical')),
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "warnings_select_seller_or_admin" ON public.warnings;
CREATE POLICY "warnings_select_seller_or_admin"
  ON public.warnings FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "warnings_insert_admin" ON public.warnings;
CREATE POLICY "warnings_insert_admin"
  ON public.warnings FOR INSERT TO authenticated
  WITH CHECK (public.current_role() = 'admin');

DROP POLICY IF EXISTS "warnings_update_admin" ON public.warnings;
CREATE POLICY "warnings_update_admin"
  ON public.warnings FOR UPDATE TO authenticated
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- ---------- trigger: maintain trust_score + warnings_count + auto-block ----------
CREATE OR REPLACE FUNCTION public.apply_warning_effects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_count int;
  new_score int;
  should_block boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO w_count
    FROM public.warnings
    WHERE seller_id = NEW.seller_id AND is_resolved = false;

    -- each unresolved warning reduces trust; severity scales the penalty
    new_score := GREATEST(0, 100 - (
      (SELECT COUNT(*) FROM public.warnings WHERE seller_id = NEW.seller_id AND severity='minor' AND is_resolved=false) * 5 +
      (SELECT COUNT(*) FROM public.warnings WHERE seller_id = NEW.seller_id AND severity='major' AND is_resolved=false) * 15 +
      (SELECT COUNT(*) FROM public.warnings WHERE seller_id = NEW.seller_id AND severity='critical' AND is_resolved=false) * 30
    ));

    -- auto-block at 3+ unresolved or a critical warning or score 0
    IF w_count >= 3 OR NEW.severity = 'critical' OR new_score = 0 THEN
      should_block := true;
    END IF;

    UPDATE public.profiles
      SET warnings_count = w_count,
          trust_score = new_score,
          is_blocked = CASE WHEN should_block THEN true ELSE is_blocked END,
          blocked_reason = CASE WHEN should_block THEN 'Automatic block: repeated violations' ELSE blocked_reason END,
          updated_at = now()
    WHERE id = NEW.seller_id;

  ELSIF TG_OP = 'UPDATE' AND NEW.is_resolved = true AND OLD.is_resolved = false THEN
    SELECT COUNT(*) INTO w_count
    FROM public.warnings
    WHERE seller_id = NEW.seller_id AND is_resolved = false;

    new_score := GREATEST(0, 100 - (
      (SELECT COUNT(*) FROM public.warnings WHERE seller_id = NEW.seller_id AND severity='minor' AND is_resolved=false) * 5 +
      (SELECT COUNT(*) FROM public.warnings WHERE seller_id = NEW.seller_id AND severity='major' AND is_resolved=false) * 15 +
      (SELECT COUNT(*) FROM public.warnings WHERE seller_id = NEW.seller_id AND severity='critical' AND is_resolved=false) * 30
    ));

    UPDATE public.profiles
      SET warnings_count = w_count,
          trust_score = new_score,
          updated_at = now()
    WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS warnings_effects ON public.warnings;
CREATE TRIGGER warnings_effects
  AFTER INSERT OR UPDATE ON public.warnings
  FOR EACH ROW EXECUTE FUNCTION public.apply_warning_effects();

-- ---------- trigger: create profile on auth signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::text, 'buyer'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- updated_at helper ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_warnings_seller ON public.warnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
