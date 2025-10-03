
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx"; 
import { BrowserRouter } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AuthProvider } from "./context/AuthContext";

const pk =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) ||
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

if (!pk) {
  console.warn(
    "Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY or REACT_APP_STRIPE_PUBLISHABLE_KEY."
  );
}
const stripePromise = pk ? loadStripe(pk) : null;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Elements stripe={stripePromise}>
          <App />
        </Elements>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
