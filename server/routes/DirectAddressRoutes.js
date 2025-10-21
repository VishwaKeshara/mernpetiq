import express from "express";
import Address from "../Model/AddressModel.js";

const router = express.Router();

// Controller functions directly in this file
const getAddresses = async (req, res) => {
  try {
    console.log("DirectAddressRoutes: getAddresses called with userId:", req.query.userId);
    const userId = String(req.query.userId || "guest");
    const docs = await Address.find({ userId }).sort({ createdAt: 1 });
    console.log(`DirectAddressRoutes: Found ${docs.length} addresses for user ${userId}`);
    res.json(docs);
  } catch (e) {
    console.error("DirectAddressRoutes: Error in getAddresses:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

const createAddress = async (req, res) => {
  try {
    console.log("DirectAddressRoutes: createAddress called with body:", req.body);
    const userId = String(req.body.userId || "guest");
    
    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'phone', 'line1', 'city', 'state'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ 
          error: "VALIDATION_FAILED", 
          errors: { [field]: `${field} is required` } 
        });
      }
    }

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
      lastName: req.body.lastName.trim(),
      phone: String(req.body.phone).replace(/\D/g, ""),
      line1: req.body.line1.trim(),
      line2: String(req.body.line2 || "").trim(),
      city: req.body.city.trim(),
      state: req.body.state.trim(),
      postalCode: String(req.body.postalCode || "").replace(/\D/g, ""),
      country: String(req.body.country || "Sri Lanka").trim(),
    });

    console.log("DirectAddressRoutes: Address created:", doc);
    res.status(201).json(doc);
  } catch (e) {
    console.error("DirectAddressRoutes: Error in createAddress:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    console.log("DirectAddressRoutes: updateAddress called with params:", req.params, "and body:", req.body);
    const id = req.params.id;
    const userId = String(req.body.userId || "guest");
    
    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'phone', 'line1', 'city', 'state'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ 
          error: "VALIDATION_FAILED", 
          errors: { [field]: `${field} is required` } 
        });
      }
    }

    const doc = await Address.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          firstName: req.body.firstName.trim(),
          lastName: req.body.lastName.trim(),
          phone: String(req.body.phone).replace(/\D/g, ""),
          line1: req.body.line1.trim(),
          line2: String(req.body.line2 || "").trim(),
          city: req.body.city.trim(),
          state: req.body.state.trim(),
          postalCode: String(req.body.postalCode || "").replace(/\D/g, ""),
          country: String(req.body.country || "Sri Lanka").trim(),
        }
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });
    console.log("DirectAddressRoutes: Address updated:", doc);
    res.json(doc);
  } catch (e) {
    console.error("DirectAddressRoutes: Error in updateAddress:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    console.log("DirectAddressRoutes: deleteAddress called with params:", req.params, "and query:", req.query);
    const id = req.params.id;
    const userId = String(req.query.userId || req.body.userId || "guest");
    const doc = await Address.findOneAndDelete({ _id: id, userId });
    if (!doc) return res.status(404).json({ error: "NOT_FOUND" });
    console.log("DirectAddressRoutes: Address deleted:", doc);
    res.json({ ok: true, deletedId: id });
  } catch (e) {
    console.error("DirectAddressRoutes: Error in deleteAddress:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

// Define routes
router.get("/addresses", getAddresses);
router.post("/addresses", createAddress);
router.patch("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

export default router;