import Pet from "../Model/Pet.js";
import Register from "../Model/Register.js";

// Create a new pet profile
export const createPet = async (req, res) => {
    try {
        const {
            name,
            species,
            breed,
            age,
            weight,
            color,
            gender,
            dateOfBirth,
            microchipNumber,
            ownerId,
            allergies,
            emergencyContact,
            photo
        } = req.body;

        // Validate required fields
        if (!name || !species || !breed || !age || !weight || !color || !gender || !dateOfBirth || !ownerId) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if owner exists
        const owner = await Register.findById(ownerId);
        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }

        // Create new pet
        const newPet = new Pet({
            name,
            species,
            breed,
            age,
            weight,
            color,
            gender,
            dateOfBirth,
            microchipNumber,
            ownerId,
            allergies: allergies || [],
            emergencyContact: emergencyContact || {},
            photo
        });

        const savedPet = await newPet.save();

        res.status(201).json({
            success: true,
            message: "Pet profile created successfully",
            data: savedPet
        });

    } catch (error) {
        console.error("Error creating pet:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all pets for a specific owner
export const getPetsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;

        const pets = await Pet.find({ ownerId, isActive: true })
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Pets retrieved successfully",
            data: pets
        });

    } catch (error) {
        console.error("Error fetching pets:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get a single pet by ID
export const getPetById = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await Pet.findById(id)
            .populate('ownerId', 'name email phone addressLine1 city state');

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pet retrieved successfully",
            data: pet
        });

    } catch (error) {
        console.error("Error fetching pet:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update pet profile
export const updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const pet = await Pet.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).populate('ownerId', 'name email phone');

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pet profile updated successfully",
            data: pet
        });

    } catch (error) {
        console.error("Error updating pet:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete pet profile (soft delete)
export const deletePet = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await Pet.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: Date.now() },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pet profile deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting pet:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add medical record to pet
export const addMedicalRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { condition, treatment, veterinarian, notes } = req.body;

        if (!condition || !treatment) {
            return res.status(400).json({
                success: false,
                message: "Condition and treatment are required"
            });
        }

        const pet = await Pet.findByIdAndUpdate(
            id,
            {
                $push: {
                    medicalHistory: {
                        condition,
                        treatment,
                        veterinarian,
                        notes,
                        date: new Date()
                    }
                },
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Medical record added successfully",
            data: pet
        });

    } catch (error) {
        console.error("Error adding medical record:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add vaccination record to pet
export const addVaccination = async (req, res) => {
    try {
        const { id } = req.params;
        const { vaccineName, dateGiven, nextDueDate, veterinarian } = req.body;

        if (!vaccineName || !dateGiven) {
            return res.status(400).json({
                success: false,
                message: "Vaccine name and date given are required"
            });
        }

        const pet = await Pet.findByIdAndUpdate(
            id,
            {
                $push: {
                    vaccinations: {
                        vaccineName,
                        dateGiven,
                        nextDueDate,
                        veterinarian
                    }
                },
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vaccination record added successfully",
            data: pet
        });

    } catch (error) {
        console.error("Error adding vaccination:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all pets (for admin)
export const getAllPets = async (req, res) => {
    try {
        const pets = await Pet.find({ isActive: true })
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "All pets retrieved successfully",
            data: pets
        });

    } catch (error) {
        console.error("Error fetching all pets:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
