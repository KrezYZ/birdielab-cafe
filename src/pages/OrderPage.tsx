import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { menuItems, getMenuByCategory } from '../data/menu'
import { CATEGORY_LABELS, type CartItem, type MenuItem } from '../types'
import { supabase } from '../supabase/config'
import { ShoppingCart, X, Plus, Minus, Check } from 'lucide-react'

export default function OrderPage() {
  const [searchParams] = useSearchParams()
  const tableNumber = parseInt(searchParams.get('table') || '1', 10)

  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [note, setNote] = useState('')

  const menuByCategory = useMemo(() => getMenuByCategory(), [])
  const categories = Array.from(menuByCategory.keys())

  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) {
        return prev.map(c =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(c =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        )
      }
      return prev.filter(c => c.menuItem.id !== itemId)
    })
  }

  const submitOrder = async () => {
    if (cart.length === 0 || submitting) return
    setSubmitting(true)

    const order = {
      table_number: tableNumber,
      items: cart.map(c => ({
        name: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
        note: c.note || undefined,
      })),
      total: cartTotal,
      status: 'new' as const,
      note: note || undefined,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('cafe_orders').insert(order)

    if (error) {
      console.error('提交失败:', error)
      alert('提交失败，请重试')
    } else {
      setSubmitted(true)
      setCart([])
      setNote('')
    }

    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">订单已提交！</h1>
        <p className="text-gray-600 mb-1">¡Pedido enviado!</p>
        <p className="text-lg font-semibold text-green-700 mt-4">{tableNumber} 号桌 / Mesa {tableNumber}</p>
        <p className="text-gray-500 mt-2">我们会尽快为您准备</p>
        <p className="text-gray-400 text-sm">Prepararemos su pedido pronto</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 px-6 py-3 bg-green-700 text-white rounded-xl font-medium"
        >
          继续点单 / Pedir más
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <header className="sticky top-0 z-10 bg-green-800 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🏌️ BirdieLab Café</h1>
            <p className="text-green-200 text-sm">
              {tableNumber} 号桌 / Mesa {tableNumber}
            </p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 bg-green-700 rounded-lg"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 菜单 */}
      <div className="p-3 space-y-4">
        {categories.map(category => (
          <section key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h2 className="px-4 py-3 bg-green-50 text-green-800 font-bold text-base border-b border-green-100">
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
            </h2>
            <div>
              {(menuByCategory.get(category) || []).map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 active:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-800">{item.name}</div>
                      {item.nameEs && (
                        <div className="text-xs text-gray-400">{item.nameEs}</div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-green-700">¥{item.price}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 底部购物车栏 */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow-xl z-10">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between bg-green-700 text-white px-5 py-3 rounded-xl font-medium active:bg-green-800"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              查看购物车 ({cartCount})
            </span>
            <span>¥{cartTotal}</span>
          </button>
        </div>
      )}

      {/* 购物车抽屉 */}
      {showCart && (
        <div className="fixed inset-0 z-20 flex flex-col">
          <div className="flex-1 bg-black/40" onClick={() => { setShowCart(false); setShowConfirm(false) }} />
          <div className="bg-white rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                购物车 / Carrito ({cartCount})
              </h2>
              <button onClick={() => { setShowCart(false); setShowConfirm(false) }}
                className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.menuItem.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {item.menuItem.emoji} {item.menuItem.name}
                    </div>
                    <div className="text-sm text-gray-500">¥{item.menuItem.price}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => removeFromCart(item.menuItem.id)}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-200">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item.menuItem)}
                      className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 active:bg-green-200">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showConfirm && (
              <div className="border-t p-4 space-y-3">
                <label className="block text-sm text-gray-600">
                  备注 / Nota (选填):
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="如: 少冰 / Menos hielo..."
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
            )}

            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>合计 / Total</span>
                <span className="text-green-700">¥{cartTotal}</span>
              </div>

              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-3 bg-green-700 text-white rounded-xl font-medium active:bg-green-800"
                >
                  确认下单 / Confirmar
                </button>
              ) : (
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="w-full py-3 bg-green-700 text-white rounded-xl font-medium active:bg-green-800 disabled:opacity-50"
                >
                  {submitting ? '提交中...' : `提交订单 • ¥${cartTotal}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
