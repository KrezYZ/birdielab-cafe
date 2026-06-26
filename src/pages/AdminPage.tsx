import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase/config'
import type { OrderRecord, OrderStatus } from '../types'
import type { ReactNode } from 'react'
import { printReceipt } from '../utils/printReceipt'
import { Printer, CheckCircle, Clock, Coffee, XCircle, RefreshCw, Bell, BellOff } from 'lucide-react'

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; icon: ReactNode }> = {
  new:        { label: '🆕 新订单', color: 'bg-red-100 text-red-700 border-red-300', icon: <Bell className="w-5 h-5 text-red-500" /> },
  preparing:  { label: '👨‍🍳 准备中', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <Clock className="w-5 h-5 text-yellow-500" /> },
  done:       { label: '✅ 已完成', color: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  cancelled:  { label: '❌ 已取消', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <XCircle className="w-5 h-5 text-gray-400" /> },
}

// 提示音 - 用 Web Audio API 生成简单的提示音
function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
    // 第二个音
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = 1000
    osc2.type = 'sine'
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.2)
    osc2.stop(ctx.currentTime + 0.5)
  } catch {
    // 忽略自动播放限制
  }
}

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoPrint, setAutoPrint] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const knownIds = useRef<Set<string>>(new Set())

  // 加载已有订单
  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('cafe_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) {
      setOrders(data as OrderRecord[])
      knownIds.current = new Set((data as OrderRecord[]).map(o => o.id!).filter(Boolean))
    }
    setLoading(false)
  }, [])

  // 初始化
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 实时监听新订单
  useEffect(() => {
    const channel = supabase
      .channel('cafe_orders_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cafe_orders' },
        (payload) => {
          const newOrder = payload.new as OrderRecord
          if (knownIds.current.has(newOrder.id!)) return
          knownIds.current.add(newOrder.id!)

          setOrders(prev => [newOrder, ...prev])

          if (soundEnabled) playNotificationSound()
          if (autoPrint) {
            setTimeout(() => printReceipt(newOrder), 500)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cafe_orders' },
        (payload) => {
          const updated = payload.new as OrderRecord
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [soundEnabled, autoPrint])

  // 更新订单状态
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const updates: Partial<OrderRecord> = { status }
    if (status === 'done') {
      updates.completed_at = new Date().toISOString()
    }
    await supabase.from('cafe_orders').update(updates).eq('id', orderId)
  }

  // 手动打印
  const handlePrint = (order: OrderRecord) => {
    printReceipt(order)
  }

  // 过滤后的订单
  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  // 新订单数
  const newCount = orders.filter(o => o.status === 'new').length
  const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-10 bg-green-800 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">🏌️ BirdieLab 后台</h1>
            <p className="text-green-200 text-sm">订单管理</p>
          </div>
          <div className="flex items-center gap-3">
            {newCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {newCount} 新
              </span>
            )}
            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${soundEnabled ? 'bg-green-700' : 'bg-gray-600'}`}
              title={soundEnabled ? '关闭提示音' : '开启提示音'}>
              {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <button onClick={loadOrders} className="p-2 bg-green-700 rounded-lg" title="刷新">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {([
            ['all', '全部'],
            ['new', '新订单'],
            ['preparing', '准备中'],
            ['done', '已完成'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-white text-green-800'
                  : 'bg-green-700 text-green-100'
              }`}
            >
              {label}
              {key === 'new' && newCount > 0 && ` (${newCount})`}
            </button>
          ))}
        </div>
      </header>

      {/* 自动打印开关 */}
      <div className="px-4 py-2 bg-white border-b flex items-center justify-between">
        <span className="text-sm text-gray-600">🖨️ 新订单自动打印</span>
        <button
          onClick={() => setAutoPrint(!autoPrint)}
          className={`w-12 h-6 rounded-full transition-colors ${autoPrint ? 'bg-green-600' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${autoPrint ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* 订单列表 */}
      <div className="p-3 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Coffee className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无订单</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const s = STATUS_MAP[order.status]
            const isActive = order.status === 'new' || order.status === 'preparing'
            return (
              <div key={order.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                  order.status === 'new' ? 'border-red-300 animate-pulse' :
                  order.status === 'preparing' ? 'border-yellow-300' :
                  'border-transparent'
                }`}>
                {/* 订单头 */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-green-800">
                      #{order.table_number}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${s.color}`}>
                    {s.label}
                  </span>
                </div>

                {/* 订单内容 */}
                <div className="px-4 py-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 text-sm">
                      <span>
                        {item.name} x{item.quantity}
                        {item.note && <span className="text-gray-400 ml-1">({item.note})</span>}
                      </span>
                      <span className="font-medium">¥{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                    <span>合计</span>
                    <span className="text-green-700">¥{order.total.toFixed(0)}</span>
                  </div>
                  {order.note && (
                    <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      📝 {order.note}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex border-t">
                  {order.status === 'new' && (
                    <>
                      <button
                        onClick={() => updateStatus(order.id!, 'preparing')}
                        className="flex-1 py-3 text-yellow-700 font-medium active:bg-yellow-50 flex items-center justify-center gap-1"
                      >
                        <Coffee className="w-4 h-4" /> 开始准备
                      </button>
                      <button
                        onClick={() => updateStatus(order.id!, 'cancelled')}
                        className="py-3 px-4 text-gray-400 active:bg-gray-50 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> 取消
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id!, 'done')}
                      className="flex-1 py-3 text-green-700 font-medium active:bg-green-50 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> 完成
                    </button>
                  )}
                  <button
                    onClick={() => handlePrint(order)}
                    className="py-3 px-4 text-blue-600 active:bg-blue-50 flex items-center gap-1"
                  >
                    <Printer className="w-4 h-4" /> 打印
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部统计 */}
      {!loading && activeOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t">
          <div className="flex gap-2">
            <div className="flex-1 bg-red-50 text-red-700 rounded-lg p-2 text-center">
              <div className="text-xs">待处理</div>
              <div className="text-xl font-bold">{orders.filter(o => o.status === 'new').length}</div>
            </div>
            <div className="flex-1 bg-yellow-50 text-yellow-700 rounded-lg p-2 text-center">
              <div className="text-xs">准备中</div>
              <div className="text-xl font-bold">{orders.filter(o => o.status === 'preparing').length}</div>
            </div>
            <div className="flex-1 bg-green-50 text-green-700 rounded-lg p-2 text-center">
              <div className="text-xs">已完成</div>
              <div className="text-xl font-bold">{orders.filter(o => o.status === 'done').length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
