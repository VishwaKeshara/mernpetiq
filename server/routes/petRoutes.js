import express from "express";
import {
    createPet,
    getPetsByOwner,
    getPetById,
    updatePet,
    deletePet,
    addMedicalRecord,
    addVaccination,
    getAllPets
} from "../Controllers/petController.js";

const router = express.Router();

// Create a new pet profile
router.post("/", createPet);

// Get all pets for a specific owner
router.get("/owner/:ownerId", getPetsByOwner);

// Get a single pet by ID
router.get("/:id", getPetById);

// Update pet profile
router.put("/:id", updatePet);

// Delete pet profile (soft delete)
router.delete("/:id", deletePet);

// Add medical record to pet
router.post("/:id/medical-record", addMedicalRecord);

// Add vaccination record to pet
router.post("/:id/vaccination", addVaccination);

// Get all pets (for admin)
router.get("/", getAllPets);

export default router;
