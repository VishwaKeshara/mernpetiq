const Address = require("../Model/AddressModel");

// Constants
const PROVINCES = [
  "Western","Central","Southern","Northern","Eastern",
  "North Western","North Central","Uva","Sabaragamuwa",
];

// Helper functions
function validate(body) {
  const errors = {};
  const req = (k, msg) => { if (!String(body[k] || "").trim()) errors[k] = msg; };

  req("firstName", "First name is required");
  req("lastName",  "Last name is required");
  req("phone",     "Phone is required");
  req("line1",     "Address line 1 is required");
  req("city",      "City is required");
  req("state",     "Province is required");

  if (/\d/.test(String(body.firstName || ""))) errors.firstName = "First name cannot contain numbers";
  if (/\d/.test(String(body.lastName  || ""))) errors.lastName  = "Last name cannot contain numbers";

  const phoneDigits = String(body.phone || "").replace(/\D/g, "");
  if (phoneDigits.length !== 10) errors.phone = "Phone must be 10 digits";

  if (body.postalCode && /\D/.test(String(body.postalCode))) {
    errors.postalCode = "Postal code must be numbers only";
  }

  if (String(body.state || "").trim() && !PROVINCES.includes(body.state)) {
    errors.state = "Province must be one of the 9 Sri Lankan provinces";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

// Controller functions
const getAddresses = async (req, res) => {
  try {
    const userId = String(req.query.userId || "guest");
    const docs = await Address.find({ userId }).sort({ createdAt: 1 });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

const createAddress = async (req, res) => {
  try {
    const userId = String(req.body.userId || "guest");
    const { ok, errors } = validate(req.body);
    if (!ok) return res.status(400).json({ error: "VALIDATION_FAILED", errors });

    const count = await Address.countDocuments({ userId });
    if (count >= 3) {
      return res.status(409).json({
        error: "MAX_LIMIT_REACHED",
        message: "You can only add up to 3 delivery addresses."
      });
    }

    const doc = await Address.create({
      userId,
      firstName: req.body.firstName.trim(),
      lastName:  req.body.lastName.trim(),
      phone:     String(req.body.phone).replace(/\D/g, ""),
      line1:     req.body.line1.trim(),
      line2:     String(req.body.line2 || "").trim(),
      city:      req.body.city.trim(),
      state:     req.body.state.trim(),
      postalCode:String(req.body.postalCode || "").replace(/\D/g, ""),
      country:   String(req.body.country || "Sri Lanka").trim(),
    });

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = String(req.body.userId || "guest");
    const { ok, errors } = validate(req.body);
    if (!ok) return res.status(400).json({ error: "VALIDATION_FAILED", errors });

    const doc = await Address.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          firstName: req.body.firstName.trim(),
          lastName:  req.body.lastName.trim(),
          phone:     String(req.body.phone).replace(/\D/g, ""),
          line1:     req.body.line1.trim(),
          line2:     String(req.body.line2 || "").trim(),
          city:      req.body.city.trim(),
          state:     req.body.state.trim(),
          postalCode:String(req.body.postalCode || "").replace(/\D/g, ""),
          country:   String(req.body.country || "Sri Lanka").trim(),
        }
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = String(req.query.userId || req.body.userId || "guest");
    const doc = await Address.findOneAndDelete({ _id: id, userId });
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ ok: true, deletedId: id });
  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

//Export all functions  
exports.getAddresses = getAddresses;
exports.createAddress = createAddress;
exports.updateAddress = updateAddress;
exports.deleteAddress = deleteAddress;
