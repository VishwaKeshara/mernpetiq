import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";

import Signup from "./pages/Signup";
import Login from "./pages/Login";      
import Home from "./pages/Home";
import Profile from "./pages/profile";

import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import Cart from "./components/Cart";
import Employees from "./admin/Employees";

import { Outlet } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import Services from "./pages/Services";
import AllProducts from "./pages/AllProducts";
import ProductProfile from "./pages/ProductProfile";
import Checkout from "./pages/Checkout";
import { ProductList, ProductAdd, ProductDashboard } from "./Features/petProduct";
import AppointmentList from "./Features/appointments/AppointmentList";
import AppointmentAdd from "./Features/appointments/AppointmentAdd";
import Layout from "./Layout";
import PaymentPage from "./PaymentPage";
import DeliveryPage from "./pages/DeliveryPage";
import AdminPayments from "./AdminPayments";
import AdminCards from "./AdminCards";
import AdminAddresses from "./AdminAddresses";



const AdminLayout = () => {
  const { isOpen } = useSidebar();
  
  return (
    <div style={{ minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ 
        marginLeft: isOpen ? "250px" : "60px", 
        padding: "20px", 
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        transition: "margin-left 0.3s ease"
      }}>
        <Outlet />
      </div>
    </div>
  );
};

const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return !isAdminRoute ? <Footer /> : null;
};

function App() {
  const [count, setCount] = useState(0);

  return (
    <AuthProvider>
      <CartProvider>
        <SidebarProvider>
          <Router>
            <Navbar />
            <Routes>
          
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login /> } />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={ <Profile />} />
          
          <Route path="/services"element={<Services />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/product/:id" element={<ProductProfile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route element={<Layout />}>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          </Route>




          <Route path="/admin" element={<AdminLayout />}>
            <Route path="userlist" element={<Employees />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductDashboard />} />
            <Route path="products/list" element={<ProductList />} />
            <Route path="products/add" element={<ProductAdd />} />
            <Route path="payments" element={<AdminPayments/>}/>
            <Route path="cards" element={<AdminCards />} />
            <Route path="addresses" element={<AdminAddresses />} />

            <Route path="appointments" element={<AppointmentList />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />


          <Route path="*" element={<Navigate to="/" replace />} />


          <Route path="/appointmentAdd" element={<AppointmentAdd />} />
          <Route path="/appointmentList" element={<AppointmentList />} />

        </Routes>
        <ConditionalFooter />
        <Cart />
      </Router>
        </SidebarProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
