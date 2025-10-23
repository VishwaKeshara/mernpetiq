import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SidebarProvider } from "./context/SidebarContext";

import Signup from "./pages/Signup";
import Login from "./pages/Login";      
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import Cart from "./components/Cart";
import Employees from "./admin/Employees";
import ProfileManagement from "./admin/ProfileManagement";
import RegisteredUsers from "./admin/RegisteredUsers";
import Adminlogin from "./admin/Adminlogin";
import Adminregister from "./admin/Adminregister";

import { Outlet } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import Services from "./pages/Services";
import AllProducts from "./pages/AllProducts";
import ProductProfile from "./pages/ProductProfile";
import Checkout from "./pages/Checkout";
import { ProductList, ProductAdd, ProductDashboard } from "./Features/petProduct";
import AppointmentList from "./Features/appointments/AppointmentList";
import AppointmentAdd from "./Features/appointments/AppointmentAdd";
import PaymentPage from "./Features/Payment/PaymentPage";
import DeliveryPage from "./Features/Delivery/DeliveryPage";
import AdminPayments from "./Features/Payment/AdminPayments";
import AdminCards from "./Features/Payment/AdminCards";
import AdminAddresses from "./Features/Delivery/AdminAddresses";

import VetDashboard from "./Features/medicalRecords/vetDashboard";
import { useSidebar } from "./context/SidebarContext";

const AdminLayout = () => {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className={`bg-gray-50 p-6 min-h-screen transition-all duration-300 ${
        isOpen ? "ml-64" : "ml-16"
      }`}>
        <Outlet />
      </div>
    </div>
  );
};

const ConditionalNavbar = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return !isAdminRoute ? <Navbar /> : null;
};

const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return !isAdminRoute ? <Footer /> : null;
};

const ConditionalCart = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return !isAdminRoute ? <Cart /> : null;
};

function App() {

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
            <ConditionalNavbar />
            <Routes>
          
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login /> } />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={ <Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Authentication Routes */}
          <Route path="/adminlogin" element={<Adminlogin />} />
          <Route path="/adminregister" element={<Adminregister />} />
          
          <Route path="/services" element={<Services />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/product/:id" element={<ProductProfile />} />
          <Route path="/checkout" element={<Checkout />} />


           <Route path="/payment" element={<PaymentPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          




          <Route path="/admin" element={
            <SidebarProvider>
              <AdminLayout />
            </SidebarProvider>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<ProfileManagement />} />
            <Route path="userlist" element={<Employees />} />
            <Route path="registered-users" element={<RegisteredUsers />} />
            <Route path="appointments" element={<AppointmentList />} />
            <Route path="medical-records" element={<VetDashboard />} />
            <Route path="payments" element={<AdminPayments/>}/>
            <Route path="cards" element={<AdminCards />} />
            <Route path="addresses" element={<AdminAddresses />} />
            <Route path="products" element={<ProductDashboard />} />
            <Route path="products/list" element={<ProductList />} />
            <Route path="products/add" element={<ProductAdd />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />


          


          <Route path="/appointmentAdd" element={<AppointmentAdd />} />
          <Route path="/appointmentList" element={<AppointmentList />} />

        </Routes>
        <ConditionalFooter />
        <ConditionalCart />
      </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
