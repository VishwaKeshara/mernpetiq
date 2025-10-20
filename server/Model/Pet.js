import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    species: { 
        type: String, 
        required: true,
        enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other']
    },
    breed: { 
        type: String, 
        required: true,
        trim: true
    },
    age: { 
        type: Number, 
        required: true,
        min: 0
    },
    weight: { 
        type: Number, 
        required: true,
        min: 0
    },
    color: { 
        type: String, 
        required: true,
        trim: true
    },
    gender: { 
        type: String, 
        required: true,
        enum: ['Male', 'Female', 'Unknown']
    },
    dateOfBirth: { 
        type: Date,
        required: true
    },
    microchipNumber: { 
        type: String,
        trim: true
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Register',
        required: true
    },
    medicalHistory: [{
        date: { type: Date, default: Date.now },
        condition: { type: String, required: true },
        treatment: { type: String, required: true },
        veterinarian: { type: String },
        notes: { type: String }
    }],
    vaccinations: [{
        vaccineName: { type: String, required: true },
        dateGiven: { type: Date, required: true },
        nextDueDate: { type: Date },
        veterinarian: { type: String }
    }],
    allergies: [{
        allergen: { type: String, required: true },
        severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
        notes: { type: String }
    }],
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String }
    },
    photo: { 
        type: String 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt field before saving
petSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Pet = mongoose.model("Pet", petSchema);

export default Pet;
