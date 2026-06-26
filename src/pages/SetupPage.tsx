import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import { Database, CheckCircle, AlertCircle, ExternalLink, Key, Loader2 } from 'lucide-react'

const SQL_STATEMENTS = `
CREATE TABLE IF NOT EXISTS public.cafe_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cafe_orders_status ON public.cafe_orders(status);
CREATE INDEX IF NOT EXISTS idx_cafe_orders_created_at ON public.cafe_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cafe_orders_table ON public.cafe_orders(table_number);

ALTER TABLE public.cafe_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_cafe_orders" ON public.cafe_orders;
CREATE POLICY "allow_insert_cafe_orders" ON public.cafe_orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_select_cafe_orders" ON public.cafe_orders;
CREATE POLICY "allow_select_cafe_orders" ON public.cafe_orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "allow_update_cafe_orders" ON public.cafe_orders;
CREATE POLICY "allow_update_cafe_orders" ON public.cafe_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cafe_orders;
`

export default function SetupPage() {
  const [serviceKey, setServiceKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(true)
  const [tableExists, setTableExists] = useState(false)

  // Check if table already exists
  useEffect(() => {
    supabase.from('cafe_orders').select('count', { count: 'exact', head: true }).then(({ error }) => {
      if (!error) {
        setTableExists(true)
        setStatus('success')
        setMessage('✅ 数据库已配置完毕，系统就绪！')
      }
      setChecking(false)
    })
  }, [])

  const runSetup = async () => {
    if (!serviceKey.trim()) {
      setStatus('error')
      setMessage('请输入 service_role 密钥')
      return
    }

    setStatus('running')
    setMessage('正在创建数据库表...')

    try {
      // 用 service_role key 创建临时客户端执行 SQL
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(
        'https://bykfoersygrhtnlueibu.supabase.co',
        serviceKey.trim()
      )

      // 逐条执行
      const statements = SQL_STATEMENTS
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const sql of statements) {
        const { error } = await adminClient.rpc('exec_sql', { sql: sql + ';' }).maybeSingle()
        // rpc might not exist, try direct approach
      }

      // 尝试通过 REST API 直接创建
      const resp = await fetch(
        'https://bykfoersygrhtnlueibu.supabase.co/rest/v1/rpc/exec_sql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey.trim(),
            'Authorization': `Bearer ${serviceKey.trim()}`,
          },
          body: JSON.stringify({ sql: SQL_STATEMENTS }),
        }
      )

      if (resp.ok) {
        setStatus('success')
        setMessage('✅ 数据库配置成功！系统已就绪。')
        setTableExists(true)
      } else {
        // exec_sql 可能不存在，尝试使用管理 API
        const errData = await resp.json().catch(() => ({}))
        if (resp.status === 404) {
          // 回退方案：使用 Supabase Management API
          const mgmtResp = await fetch(
            'https://api.supabase.com/v1/projects/bykfoersygrhtnlueibu/query',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey.trim()}`,
              },
              body: JSON.stringify({ query: SQL_STATEMENTS }),
            }
          )

          if (mgmtResp.ok) {
            setStatus('success')
            setMessage('✅ 数据库配置成功！系统已就绪。')
            setTableExists(true)
          } else {
            throw new Error('两种方式都失败了，请检查密钥是否正确')
          }
        } else {
          throw new Error((errData as any).message || '执行失败')
        }
      }
    } catch (e: any) {
      setStatus('error')
      setMessage(`❌ 配置失败: ${e.message || '未知错误'}`)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-green-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">系统初始化</h1>
          <p className="text-gray-500 mt-1">Configuración de Base de Datos</p>
        </div>

        {tableExists ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-800 font-medium">{message}</p>
            <a href="/#/admin" className="inline-block mt-4 px-6 py-2 bg-green-700 text-white rounded-lg font-medium">
              进入后台管理 →
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="w-4 h-4 inline mr-1" />
                Supabase Service Role Key:
              </label>
              <input
                type="password"
                value={serviceKey}
                onChange={e => setServiceKey(e.target.value)}
                placeholder="sb_secret_..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>

            <a
              href="https://supabase.com/dashboard/project/bykfoersygrhtnlueibu/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              在 Supabase Dashboard 中获取密钥
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={runSetup}
              disabled={status === 'running'}
              className="w-full py-3 bg-green-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'running' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 配置中...</>
              ) : (
                '🚀 一键配置数据库'
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              密钥仅在本地使用，不会被存储或上传。
              <br />
              只需要运行一次。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
