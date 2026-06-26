import type { MenuItem } from '../types'

export const menuItems: MenuItem[] = [
  // ☕ 咖啡
  { id: 'c1', name: '浓缩咖啡', nameEs: 'Espresso', price: 25, category: 'coffee', emoji: '☕', available: true },
  { id: 'c2', name: '美式咖啡', nameEs: 'Americano', price: 30, category: 'coffee', emoji: '☕', available: true },
  { id: 'c3', name: '拿铁', nameEs: 'Latte', price: 35, category: 'coffee', emoji: '☕', available: true },
  { id: 'c4', name: '卡布奇诺', nameEs: 'Cappuccino', price: 35, category: 'coffee', emoji: '☕', available: true },
  { id: 'c5', name: '冰美式', nameEs: 'Iced Americano', price: 32, category: 'coffee', emoji: '🧊', available: true },
  { id: 'c6', name: '冰拿铁', nameEs: 'Iced Latte', price: 38, category: 'coffee', emoji: '🧊', available: true },

  // 🍵 茶
  { id: 't1', name: '绿茶', nameEs: 'Té Verde', price: 25, category: 'tea', emoji: '🍵', available: true },
  { id: 't2', name: '红茶', nameEs: 'Té Negro', price: 25, category: 'tea', emoji: '🍵', available: true },
  { id: 't3', name: '茉莉花茶', nameEs: 'Té de Jazmín', price: 28, category: 'tea', emoji: '🌸', available: true },
  { id: 't4', name: '柠檬茶', nameEs: 'Té de Limón', price: 30, category: 'tea', emoji: '🍋', available: true },

  // 🥤 饮品
  { id: 'd1', name: '可乐', nameEs: 'Coca-Cola', price: 20, category: 'drink', emoji: '🥤', available: true },
  { id: 'd2', name: '雪碧', nameEs: 'Sprite', price: 20, category: 'drink', emoji: '🥤', available: true },
  { id: 'd3', name: '苏打水', nameEs: 'Agua con Gas', price: 15, category: 'drink', emoji: '💧', available: true },
  { id: 'd4', name: '矿泉水', nameEs: 'Agua Mineral', price: 12, category: 'drink', emoji: '💧', available: true },
  { id: 'd5', name: '橙汁', nameEs: 'Jugo de Naranja', price: 28, category: 'drink', emoji: '🍊', available: true },
  { id: 'd6', name: '红牛', nameEs: 'Red Bull', price: 30, category: 'drink', emoji: '⚡', available: true },

  // 🍺 啤酒
  { id: 'b1', name: '百威', nameEs: 'Budweiser', price: 35, category: 'beer', emoji: '🍺', available: true },
  { id: 'b2', name: '科罗娜', nameEs: 'Corona', price: 38, category: 'beer', emoji: '🍺', available: true },
  { id: 'b3', name: '喜力', nameEs: 'Heineken', price: 38, category: 'beer', emoji: '🍺', available: true },
  { id: 'b4', name: '青岛啤酒', nameEs: 'Tsingtao', price: 30, category: 'beer', emoji: '🍺', available: true },

  // 🍿 小吃
  { id: 's1', name: '薯条', nameEs: 'Papas Fritas', price: 30, category: 'snack', emoji: '🍟', available: true },
  { id: 's2', name: '炸鸡翅', nameEs: 'Alitas', price: 38, category: 'snack', emoji: '🍗', available: true },
  { id: 's3', name: '坚果拼盘', nameEs: 'Mix de Nueces', price: 28, category: 'snack', emoji: '🥜', available: true },
  { id: 's4', name: '玉米片', nameEs: 'Nachos', price: 32, category: 'snack', emoji: '🌽', available: true },

  // 🍽️ 简餐
  { id: 'f1', name: '火腿三明治', nameEs: 'Sándwich de Jamón', price: 40, category: 'food', emoji: '🥪', available: true },
  { id: 'f2', name: '金枪鱼三明治', nameEs: 'Sándwich de Atún', price: 42, category: 'food', emoji: '🥪', available: true },
  { id: 'f3', name: '热狗', nameEs: 'Hot Dog', price: 35, category: 'food', emoji: '🌭', available: true },
  { id: 'f4', name: '牛肉汉堡', nameEs: 'Hamburguesa', price: 48, category: 'food', emoji: '🍔', available: true },
]

export function getMenuByCategory() {
  const map = new Map<string, MenuItem[]>()
  menuItems
    .filter(item => item.available)
    .forEach(item => {
      const list = map.get(item.category) || []
      list.push(item)
      map.set(item.category, list)
    })
  return map
}
