import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import Products from './pages/Products';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminServices from './pages/AdminServices';
import AdminUsers from './pages/AdminUsers';
import AdminProducts from './pages/AdminProducts';
import AdminCompany from './pages/AdminCompany';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="services" element={<Services />} />
            <Route path="products" element={<Products />} />
            <Route path="booking" element={<Booking />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/services" element={<AdminServices />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/products" element={<AdminProducts />} />
            <Route path="admin/company" element={<AdminCompany />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
