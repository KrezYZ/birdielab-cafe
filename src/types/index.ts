// 菜单项类型
export interface MenuItem {
  id: string
  name: string
  nameEs?: string  // 西班牙语名
  price: number
  category: MenuCategory
  description?: string
  emoji: string
  available: boolean
}

// 菜单分类
export type MenuCategory = 'coffee' | 'tea' | 'drink' | 'beer' | 'snack' | 'food'

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  coffee: '☕ 咖啡 / Café',
  tea: '🍵 茶 / Té',
  drink: '🥤 饮品 / Bebidas',
  beer: '🍺 啤酒 / Cerveza',
  snack: '🍿 小吃 / Snacks',
  food: '🍽️ 简餐 / Comida',
}

// 购物车项目
export interface CartItem {
  menuItem: MenuItem
  quantity: number
  note?: string  // 备注
}

// 订单状态
export type OrderStatus = 'new' | 'preparing' | 'done' | 'cancelled'

// 订单
export interface Order {
  id: string
  tableNumber: number
  items: OrderItem[]
  total: number
  status: OrderStatus
  note?: string
  createdAt: string  // ISO string
  completedAt?: string
}

export interface OrderItem {
  name: string
  price: number
  quantity: number
  note?: string
}

// Supabase 中的订单记录
export interface OrderRecord {
  id?: string
  table_number: number
  items: OrderItem[]
  total: number
  status: OrderStatus
  note?: string
  created_at: string
  completed_at?: string
}
