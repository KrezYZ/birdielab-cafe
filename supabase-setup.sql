-- ====================================
-- BirdieLab Café 点餐系统 - Supabase 数据库设置
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ====================================

-- 1. 创建订单表
CREATE TABLE IF NOT EXISTS public.cafe_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_cafe_orders_status ON public.cafe_orders(status);
CREATE INDEX IF NOT EXISTS idx_cafe_orders_created_at ON public.cafe_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cafe_orders_table ON public.cafe_orders(table_number);

-- 3. 启用 RLS (行级安全)
ALTER TABLE public.cafe_orders ENABLE ROW LEVEL SECURITY;

-- 4. 创建策略：任何人都可以插入（客户提交订单）
CREATE POLICY "允许任何人提交订单" ON public.cafe_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. 创建策略：任何人都可以读取（后台需要看到订单）
CREATE POLICY "允许任何人查看订单" ON public.cafe_orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. 创建策略：任何人都可以更新（后台改变订单状态）
CREATE POLICY "允许任何人更新订单" ON public.cafe_orders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 7. 启用 Supabase Realtime (用于实时通知)
ALTER PUBLICATION supabase_realtime ADD TABLE public.cafe_orders;

-- ====================================
-- 测试数据（可选，上线后可删除）
-- ====================================
-- INSERT INTO public.cafe_orders (table_number, items, total, status, created_at)
-- VALUES
--   (1, '[{"name":"拿铁","price":35,"quantity":2},{"name":"火腿三明治","price":40,"quantity":1}]', 110, 'new', NOW()),
--   (2, '[{"name":"美式咖啡","price":30,"quantity":1},{"name":"薯条","price":30,"quantity":1}]', 60, 'preparing', NOW()),
--   (3, '[{"name":"科罗娜","price":38,"quantity":3}]', 114, 'done', NOW() - INTERVAL '1 hour');
