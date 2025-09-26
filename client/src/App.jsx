import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Signup from "./pages/Signup";
import Login from "./pages/Login";      
import Home from "./pages/Home";
import Profile from "./pages/profile";

import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import Employees from "./admin/Employees";

import { Outlet } from "react-router-dom";
import Dashboard from "./admin/Dashboard";
import Appointment from "./pages/Appointment";
import Services from "./pages/Services";
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

          <Route path="/admin" element={<AdminLayout />}>
            <Route path="userlist" element={<Employees />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductDashboard />} />
            <Route path="products/list" element={<ProductList />} />
            <Route path="products/add" element={<ProductAdd />} />
          </Route>

        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
