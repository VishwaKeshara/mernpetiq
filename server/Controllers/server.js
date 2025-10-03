
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const addressRoutes = require("./server/routes/AddressRoutes");
const adminAddressRoutes = require("./server/routes/AdminAddressRoutes");
const paymentRoutes = require("./server/routes/PaymentRoutes");
const { connectDatabase } = require("./server/config/database");



const app = express();
const PORT = process.env.PORT || 4242;


const allowed = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); 
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed: " + origin));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/", addressRoutes);
app.use("/", adminAddressRoutes);
app.use("/", paymentRoutes);

/* ----------------------- MongoDB connect ----------------------- */
connectDatabase();




app.get("/health", (_req, res) => res.send("ok"));
app.get("/", (_req, res) => {
  res
    .type("html")
    .send(`<!doctype html><html><head><meta charset="utf-8"/><title>VMS Payment Backend</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:2rem;line-height:1.5}code{background:#f3f4f6;padding:2px 6px;border-radius:6px}a{color:#2563eb;text-decoration:none}ul{line-height:1.9}</style></head>
<body>
<h1>VMS Payment Backend ✅</h1>
<p>Server is running. Useful endpoints:</p>
<ul>
<li><a href="/health">GET /health</a></li>
<li><code>POST /api/create-setup-intent</code></li>
<li><code>GET /api/payment-method/:pmId</code></li>
<li><code>GET /api/payment-methods</code></li>
<li><code>PATCH /api/payment-method/:pmId</code></li>
<li><code>DELETE /api/payment-method/:pmId</code></li>
<li><code>POST /api/set-default-payment-method</code></li>
<li><code>POST /api/create-payment-intent</code></li>
<li><code>POST /api/refund</code></li>
</ul>
<h3>DB-only (simple dumps)</h3>
<ul>
<li><a href="/api/db/cards">GET /api/db/cards</a></li>
<li><a href="/api/db/tx">GET /api/db/tx</a></li>
<li><a href="/api/db/tx?source=hospital">GET /api/db/tx?source=hospital</a></li>
<li><a href="/api/db/tx?ref=APPT-123">GET /api/db/tx?ref=APPT-123</a></li>
</ul>
<h3>Admin (filtered)</h3>
<ul>
<li><code>GET /api/admin/tx</code> (supports source, ref, currency, status, q, min, max, from, to)</li>
<li><code>POST /api/admin/tx/bulk-delete</code> (delete by ids / all / source/ref)</li>
</ul>
</body></html>`);
});






app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
