import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

const TABLES = [1, 2, 3, 4]
const DEFAULT_URL = 'https://birdielab.netlify.app/order'

export default function QRCodePage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_URL)
  const [qrDataUrls, setQrDataUrls] = useState<Record<number, string>>({})
  const [generating, setGenerating] = useState(false)

  const generateQRCodes = async () => {
    setGenerating(true)
    const result: Record<number, string> = {}
    for (const table of TABLES) {
      const url = `${baseUrl}?table=${table}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1B5E20', light: '#FFFFFF' },
      })
      result[table] = dataUrl
    }
    setQrDataUrls(result)
    setGenerating(false)
  }

  useEffect(() => {
    generateQRCodes()
  }, [])

  const downloadQR = (table: number) => {
    const link = document.createElement('a')
    link.download = `birdielab-mesa-${table}.png`
    link.href = qrDataUrls[table]
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-green-800 mb-2">🏌️ BirdieLab Café</h1>
        <p className="text-gray-600 mb-6">二维码生成器 / Generador de QR</p>

        {/* URL 设置 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            网站地址 / URL del sitio:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://your-site.netlify.app/order"
            />
            <button
              onClick={generateQRCodes}
              disabled={generating}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium active:bg-green-800 disabled:opacity-50"
            >
              {generating ? '生成中...' : '生成'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            部署后请将上方地址改为实际网址，然后重新点击"生成"
          </p>
        </div>

        {/* QR 码展示 */}
        <div className="grid grid-cols-2 gap-4">
          {TABLES.map(table => (
            <div key={table} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                {table} 号桌 / Mesa {table}
              </h2>
              {qrDataUrls[table] ? (
                <>
                  <img
                    src={qrDataUrls[table]}
                    alt={`QR Mesa ${table}`}
                    className="w-full aspect-square object-contain mb-3"
                  />
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadQR(table)}
                      className="w-full py-2 bg-green-700 text-white rounded-lg text-sm font-medium active:bg-green-800"
                    >
                      📥 下载 / Descargar
                    </button>
                    <button
                      onClick={() => {
                        const w = window.open('', '_blank', 'width=500,height=650')
                        if (w) {
                          w.document.write(`
                            <html><head><title>Mesa ${table} - QR</title>
                            <style>
                              @page { size: auto; margin: 0; }
                              body { text-align:center; padding:30px; font-family:sans-serif; }
                              img { max-width:350px; }
                              h1 { color:#1B5E20; }
                              @media print { button { display:none; } }
                            </style></head><body>
                              <h1>🏌️ BirdieLab Café</h1>
                              <h2>${table} 号桌 / Mesa ${table}</h2>
                              <img src="${qrDataUrls[table]}" style="width:100%;max-width:350px;" />
                              <p style="color:#666;margin-top:20px;">扫码点餐 / Escanee para pedir</p>
                              <p style="color:#999;font-size:12px;">${baseUrl}?table=${table}</p>
                              <button onclick="window.print()" style="
                                margin-top:20px;padding:12px 30px;background:#1B5E20;color:white;
                                border:none;border-radius:8px;font-size:16px;cursor:pointer;
                              ">🖨️ 打印 / Imprimir</button>
                            </body></html>
                          `)
                          w.document.close()
                        }
                      }}
                      className="w-full py-2 border border-green-700 text-green-700 rounded-lg text-sm font-medium active:bg-green-50"
                    >
                      🖨️ 打印预览
                    </button>
                  </div>
                </>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">生成中...</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          打印二维码贴到每张桌子上即可
          <br />
          Imprima y pegue el QR en cada mesa
        </p>
      </div>
    </div>
  )
}
