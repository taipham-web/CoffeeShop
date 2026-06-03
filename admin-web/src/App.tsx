import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Banners from './pages/Banners.tsx';
import Branches from './pages/Branches.tsx';
import Chat from './pages/Chat.tsx';
import DashboardLayout from './pages/DashboardLayout.tsx';
import Login from './pages/Login.tsx';
import Orders from './pages/Orders.tsx';
import Products from './pages/Products.tsx';
import Vouchers from './pages/Vouchers.tsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="banners" element={<Banners />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="chat" element={<Chat />} />
          <Route path="branches" element={<Branches />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
