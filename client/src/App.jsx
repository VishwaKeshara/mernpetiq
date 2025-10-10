import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";      
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Services from "./pages/Services";
import Appointment from "./pages/Appointment";

// Components
import PetProfile from "./components/PetProfile";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Sidebar from "./components/sidebar";

// Admin
import Employees from "./admin/Employees";
import RegisteredUsers from "./admin/RegisteredUsers";
import ProfileManagement from "./admin/ProfileManagement";
import Dashboard from "./admin/Dashboard";
import Adminlogin from "./admin/Adminlogin";
import AdminRegister from "./admin/Adminregister";

// TODO: Create these missing components
// import AppointmentAdd from "./Features/appointments/AppointmentAdd";
// import AppointmentList from "./Features/appointments/AppointmentList";
// import AppointmentPayment from "./Features/payment/AppointmentPayment";
// import AdminAppointments from "./admin/AdminAppointments";
// import PaymentManagement from "./admin/PaymentManagement";
// import MedicalRecords from "./admin/MedicalRecords";
// import MedicalRecordsDashboard from "./admin/MedicalRecordsDashboard";
// import CreditManagement from "./admin/CreditManagement";
// import UserCredits from "./components/UserCredits";

import { Outlet } from "react-router-dom";

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
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
                <Footer />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
                <Footer />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Navbar />
                <Signup />
                <Footer />
              </>
            }
          />
          <Route
            path="/profile"
            element={
              <>
                <Navbar />
                <Profile />
                <Footer />
              </>
            }
          />
          <Route
            path="/pet-profile"
            element={
              <>
                <Navbar />
                <PetProfile />
                <Footer />
              </>
            }
          />
          <Route
            path="/services"
            element={
              <>
                <Navbar />
                <Services />
                <Footer />
              </>
            }
          />
          <Route
            path="/appointments"
            element={
              <>
                <Navbar />
                <Appointment />
                <Footer />
              </>
            }
          />
          {/* TODO: Uncomment these routes when components are created */}
          {/* <Route
            path="/appointmentAdd"
            element={
              <>
                <Navbar />
                <AppointmentAdd />
                <Footer />
              </>
            }
          />
          <Route
            path="/appointmentList"
            element={
              <>
                <Navbar />
                <AppointmentList />
                <Footer />
              </>
            }
          />
          <Route
            path="/payment"
            element={
              <>
                <Navbar />
                <AppointmentPayment />
                <Footer />
              </>
            }
          />
          <Route
            path="/credits"
            element={
              <>
                <Navbar />
                <UserCredits />
                <Footer />
              </>
            }
          /> */}
          <Route
            path="/adminlogin"
            element={<Adminlogin />}
          />
          <Route
            path="/adminregister"
            element={<AdminRegister />}
          />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="userlist" element={<Employees />} />
            <Route path="registered-users" element={<RegisteredUsers />} />
            <Route path="profile" element={<ProfileManagement />} />
            {/* TODO: Create these admin components */}
            {/* <Route path="appointments" element={<AdminAppointments />} />
            <Route path="medical-records" element={<MedicalRecordsDashboard />} />
            <Route path="credits" element={<CreditManagement />} />
            <Route path="payments" element={<PaymentManagement />} /> */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;