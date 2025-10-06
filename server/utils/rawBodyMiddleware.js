// server/utils/rawBodyMiddleware.js
import bodyParser from "body-parser";

export const rawBodyMiddleware = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

// Stripe requires this for webhook verification
export const stripeRawMiddleware = bodyParser.raw({ type: "application/json" });
