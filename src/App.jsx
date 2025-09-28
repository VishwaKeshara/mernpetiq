
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./Layout"; 

import PaymentPage from "./PaymentPage";
import DeliveryPage from "./pages/DeliveryPage";
import AdminPayments from "./AdminPayments";
import AdminCards from "./AdminCards";
import AdminAddresses from "./AdminAddresses";

export default function App() {
  return (
    <Routes>
      
      <Route element={<Layout />}>
        <Route path="/" element={<PaymentPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
      </Route>

      
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/cards" element={<AdminCards />} />
      <Route path="/admin/addresses" element={<AdminAddresses />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
