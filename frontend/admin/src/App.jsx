import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Invoices from './pages/Invoices';
import QuoteRequests from './pages/QuoteRequests';
import Orders from './pages/Orders';
import Contacts from './pages/Contacts';
import Users from './pages/Users';
import Banners from './pages/Banners';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<Products />} />
            <Route path="categorias" element={<Categories />} />
            <Route path="marcas" element={<Brands />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="clientes" element={<Customers />} />
            <Route path="proveedores" element={<Suppliers />} />
            <Route path="facturas" element={<Invoices />} />
            <Route path="solicitudes" element={<QuoteRequests />} />
            <Route path="pedidos" element={<Orders />} />
            <Route path="contactos" element={<Contacts />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="contenido/banner-principal" element={<Banners />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Inter', fontSize: 14, borderRadius: 12 },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
      }} />
    </AuthProvider>
  );
}
