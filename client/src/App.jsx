import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

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
import Appointment from "./pages/Appointment";
import Services from "./pages/Services";
import AllProducts from "./pages/AllProducts";
import ProductProfile from "./pages/ProductProfile";
import Checkout from "./pages/Checkout";
import { ProductList, ProductAdd, ProductDashboard } from "./Features/petProduct";


const AdminLayout = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  const [count, setCount] = useState(0);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
      <Navbar />
        <Routes>
          
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login /> } />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={ <Profile />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/services"element={<Services />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/product/:id" element={<ProductProfile />} />
          <Route path="/checkout" element={<Checkout />} />



          <Route path="/admin" element={<AdminLayout />}>
            <Route path="userlist" element={<Employees />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductDashboard />} />
            <Route path="products/list" element={<ProductList />} />
            <Route path="products/add" element={<ProductAdd />} />
            <Route path="payments" element={<AdminPayments/>}/>
            <Route path="cards" element={<AdminCards />} />
            <Route path="addresses" element={<AdminAddresses />} />

          </Route>

        </Routes>
        <Footer />
        <Cart />
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
