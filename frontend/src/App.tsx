import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/common/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Marketplace from "./pages/buyer/Marketplace";
import ProductDetail from "./pages/buyer/ProductDetail";
import Dashboard from "./pages/Dashboard";
import { CartProvider } from '@/contexts/CartContext';
import { ChatProvider } from "./contexts/ChatContext";
import Profile from "./pages/Profile";
import About from "./pages/common/About";
import Contact from "./pages/common/Contact";
import Checkout from "./pages/buyer/Checkout";
import Cart from "./pages/buyer/Cart";
import SellerContact from "./pages/producer/SellerContact";
import Chats from "./pages/Chats";
import Orders from "./pages/buyer/Orders";
import Products from "./pages/producer/Products";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangePassword from "./pages/auth/ChangePassword";
import AddProduct from "./pages/producer/AddProduct";
import EditProduct from "./pages/producer/EditProduct";
import TransactionHistory from "./pages/producer/TransactionHistory";
import BuyerTransactionHistory from "./pages/buyer/BuyerTransactionHistory";
import TransactionDetail from "./pages/common/TransactionDetail";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import UserDetail from "./pages/admin/UserDetail";
import ProductManagement from "./pages/admin/ProductManagement";
import DisputeManagement from "./pages/admin/DisputeManagement";
import AdminDisputeDetail from "./pages/admin/AdminDisputeDetail";
import VerificationQueue from "./pages/admin/VerificationQueue";
import DisputesList from "./pages/buyer/DisputesList";
import DisputeDetail from "./pages/common/DisputeDetail";
import ProducerOrders from "./pages/producer/ProducerOrders";
import ProducerReviews from "./pages/producer/ProducerReviews";
import ProducerAnalytics from "./pages/producer/ProducerAnalytics";
import StoreSettings from "./pages/producer/StoreSettings";
import PaymentSuccess from "./pages/buyer/PaymentSuccess";
import OrderDetail from "./pages/buyer/OrderDetail";
import VerifyEmail from "./pages/auth/VerifyEmail";
import VerifyEmailNotice from "./pages/auth/VerifyEmailNotice";
import Unauthorized from "./pages/common/Unauthorized";
import NotFound from "./pages/common/NotFound";
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SocketProvider } from '@/contexts/SocketContext';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Proper RoleRoute component
const RoleRoute = ({ allowedRoles, children }: { allowedRoles: string[]; children: ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check roles case-insensitively
  const normalizedUserRole = user?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

  if (!user || !normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <ChatProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      {/* ==================== PUBLIC ROUTES ==================== */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/unauthorized" element={<Unauthorized />} />

                      {/* ==================== AUTH & VERIFICATION ROUTES ==================== */}
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* ==================== PROTECTED COMMON ROUTES ==================== */}
                      {/* All authenticated users */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/chats" element={
                        <ProtectedRoute>
                          <Chats />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } />
                      <Route path="/change-password" element={
                        <ProtectedRoute>
                          <ChangePassword />
                        </ProtectedRoute>
                      } />
                      <Route path="/transaction/:transactionId" element={
                        <ProtectedRoute>
                          <TransactionDetail />
                        </ProtectedRoute>
                      } />

                      {/* ==================== BUYER-ONLY ROUTES ==================== */}
                      <Route path="/cart" element={
                        <RoleRoute allowedRoles={['buyer']}>
                          <Cart />
                        </RoleRoute>
                      } />
                      <Route path="/checkout" element={
                        <RoleRoute allowedRoles={['buyer']}>
                          <Checkout />
                        </RoleRoute>
                      } />
                      <Route path="/my-orders" element={
                        <RoleRoute allowedRoles={['buyer']}>
                          <Orders />
                        </RoleRoute>
                      } />
                      <Route path="/buyer/transactions" element={
                        <RoleRoute allowedRoles={['buyer']}>
                          <BuyerTransactionHistory />
                        </RoleRoute>
                      } />
                      <Route path="/order/:orderId/success" element={<PaymentSuccess />} />
                      <Route path="/buyer/disputes" element={
                        <RoleRoute allowedRoles={['buyer']}>
                          <DisputesList />
                        </RoleRoute>
                      } />

                      {/* ==================== PRODUCER-ONLY ROUTES ==================== */}
                      <Route path="/my-products" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <Products />
                        </RoleRoute>
                      } />
                      <Route path="/products/add" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <AddProduct />
                        </RoleRoute>
                      } />
                      <Route path="/products/edit/:id" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <EditProduct />
                        </RoleRoute>
                      } />
                      <Route path="/producer/orders" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <ProducerOrders />
                        </RoleRoute>
                      } />
                      <Route path="/producer/reviews" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <ProducerReviews />
                        </RoleRoute>
                      } />
                      <Route path="/producer/analytics" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <ProducerAnalytics />
                        </RoleRoute>
                      } />
                      <Route path="/producer/store-settings" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <StoreSettings />
                        </RoleRoute>
                      } />
                      <Route path="/producer/transactionhistory" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <TransactionHistory />
                        </RoleRoute>
                      } />
                      <Route path="/sellers/:id/contact" element={
                        <RoleRoute allowedRoles={['producer']}>
                          <SellerContact />
                        </RoleRoute>
                      } />
                      <Route path="/producer/disputes" element={
                        <RoleRoute allowedRoles={['PRODUCER']}>
                          <DisputesList />
                        </RoleRoute>
                      } />

                      {/* ==================== SHARED  ROUTES ==================== */}
                      {/* Accessible by both buyers and producers */}
                      <Route path="/orders/:orderId" element={
                        <RoleRoute allowedRoles={['buyer', 'producer']}>
                          <OrderDetail />
                        </RoleRoute>
                      } />

                      {/* ==================== ADMIN-ONLY ROUTES ==================== */}
                      <Route path="/admin" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <AdminDashboard />
                        </RoleRoute>
                      } />
                      <Route path="/admin/users" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <UserManagement />
                        </RoleRoute>
                      } />
                      <Route path="/admin/products" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <ProductManagement />
                        </RoleRoute>
                      } />
                      <Route path="/admin/disputes" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <DisputeManagement />
                        </RoleRoute>
                      } />
                      <Route path="/disputes" element={
                        <RoleRoute allowedRoles={['BUYER', 'PRODUCER']}>
                          <DisputesList />
                        </RoleRoute>
                      } />
                      <Route path="/disputes/:disputeId" element={
                        <RoleRoute allowedRoles={['BUYER', 'PRODUCER', 'admin']}>
                          <DisputeDetail />
                        </RoleRoute>
                      } />
                      <Route path="/admin/disputes/:disputeId" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <AdminDisputeDetail />
                        </RoleRoute>
                      } />
                      <Route path="/admin/users/:userId" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <UserDetail />
                        </RoleRoute>
                      } />
                     <Route path="/admin/verification-queue" element={
                        <RoleRoute allowedRoles={['admin']}>
                            <VerificationQueue />
                        </RoleRoute>
                      } />
                      
                      {/* ==================== FALLBACK ROUTE ==================== */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </ChatProvider>
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
