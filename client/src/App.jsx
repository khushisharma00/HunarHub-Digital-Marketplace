import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Browse from './pages/Browse';
import EntrepreneurProfile from './pages/EntrepreneurProfile';
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import ServiceRequestForm from './pages/ServiceRequestForm';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import EntrepreneurDashboard from './pages/EntrepreneurDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import NotFound from './pages/NotFound';

// Protected Route Guards
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
              <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/entrepreneur/:id" element={<EntrepreneurProfile />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/book-service" element={<ServiceRequestForm />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Customer Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Entrepreneur Dashboard */}
                <Route
                  path="/entrepreneur/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['entrepreneur', 'admin']}>
                      <EntrepreneurDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Dashboard */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Notifications */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
}
