import React, { useEffect, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export default function SaveCardSheet({ open, onClose, onSaved, cardholderName }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    fetch("http://localhost:4242/api/create-setup-intent", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setErr(d.error || "Failed to create SetupIntent");
      })
      .catch((e) => setErr(e.message));
  }, [open]);

  async function handleSave() {
    if (!stripe || !elements || !clientSecret) return;
    setLoading(true);
    setErr("");
    const card = elements.getElement(CardElement);
    const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card,
        billing_details: { name: cardholderName || " " },
      },
    });
    setLoading(false);
    if (error) {
      setErr(error.message || "Could not save card");
      return;
    }
    const pmId = setupIntent.payment_method;
    
    const info = await fetch(`http://localhost:4242/api/payment-method/${pmId}`).then((r) => r.json());
    if (info.error) {
      setErr(info.error);
      return;
    }
    onSaved(info);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Add your card</h3>

        <div className="border rounded-md p-3">
          <CardElement options={{ hidePostalCode: true }} />
        </div>

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !stripe}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2"
          >
            {loading ? "Saving…" : "Save card"}
          </button>
        </div>
      </div>
    </div>
  );
}
