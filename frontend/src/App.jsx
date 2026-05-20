import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/customer/HomePage'
import CategoryPage from './components/customer/CategoryPage'
import DetailPage from './components/customer/DetailPage'
import GroupPage from './components/customer/GroupPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './components/admin/AdminLogin'
import Dashboard from './components/admin/Dashboard'
import ProductsPage from './components/admin/ProductsPage'
import CategoriesPage from './components/admin/CategoriesPage'
import LinksPage from './components/admin/LinksPage'
import QRPage from './components/admin/QRPage'
import GoRedirect from './components/GoRedirect'

/* ── Auth guard: /admin requires a successful login ── */
function AuthGuard({ children }) {
  if (localStorage.getItem('admin_authed') !== '1') {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Customer routes ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:catId" element={<CategoryPage />} />
        <Route path="/group/:groupName" element={<GroupPage />} />
        <Route path="/product/:productId" element={<DetailPage />} />

        {/* ── QR Redirect routes ── */}
        <Route path="/go/:id" element={<GoRedirect />} />

        {/* ── Admin login (public) ── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin panel (protected) ── */}
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="qr" element={<QRPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
