import type { OrderRecord } from '../types'

export function printReceipt(order: OrderRecord) {
  const date = new Date(order.created_at)
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const day = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="text-align:left;padding:3px 0;">
        ${item.name}${item.note ? `<br/><small style="color:#888;">备注: ${item.note}</small>` : ''}
      </td>
      <td style="text-align:center;padding:3px 0;">x${item.quantity}</td>
      <td style="text-align:right;padding:3px 0;">¥${(item.price * item.quantity).toFixed(0)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body {
    width: 75mm;
    margin: 0 auto;
    padding: 5mm 3mm;
    font-family: 'PingFang SC', 'Microsoft YaHei', monospace;
    font-size: 12px;
    color: #000;
    background: white;
  }
  .center { text-align: center; }
  .header { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
  .subheader { font-size: 10px; color: #555; margin-bottom: 6px; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .bold { font-weight: bold; }
  .large { font-size: 15px; }
  table { width: 100%; border-collapse: collapse; }
  .status-new { font-size: 14px; font-weight: bold; margin: 6px 0; }
</style>
</head>
<body>
  <div class="center">
    <div class="header">🏌️ BirdieLab Café</div>
    <div class="subheader">Tel: _______________</div>
    <div class="divider"></div>
    <div class="large bold">${order.table_number} 号桌 / Mesa ${order.table_number}</div>
    <div>${day} ${time}</div>
    <div>订单号: #${(order.id || '000').slice(0, 6).toUpperCase()}</div>
    <div class="divider"></div>
  </div>
  <table>${itemsHtml}</table>
  <div class="divider"></div>
  <div style="text-align:right;font-size:16px;font-weight:bold;">
    TOTAL: ¥${order.total.toFixed(0)}
  </div>
  <div class="divider"></div>
  ${order.note ? `<div style="margin:4px 0;">📝 备注: ${order.note}</div><div class="divider"></div>` : ''}
  <div class="center" style="font-size:10px;color:#888;margin-top:8px;">
    谢谢惠顾，欢迎再次光临！<br/>
    ¡Gracias por su visita!
  </div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=300,height=400')
  if (w) {
    w.document.write(html)
    w.document.close()
    // 等渲染完成后打印
    w.onload = () => {
      setTimeout(() => {
        w.print()
      }, 300)
    }
  }
}
