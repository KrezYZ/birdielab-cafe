import { Routes, Route, Navigate } from 'react-router-dom'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import QRCodePage from './pages/QRCodePage'

export default function App() {
  return (
    <Routes>
      <Route path="/order" element={<OrderPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/qrcodes" element={<QRCodePage />} />
      <Route path="*" element={<Navigate to="/order?table=1" replace />} />
    </Routes>
  )
}
