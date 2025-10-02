import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  petName: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [50, 'Pet name cannot exceed 50 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  petType: {
    type: String,
    required: [true, 'Pet type is required'],
    enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other']
  },
  breed: {
    type: String,
    trim: true,
    maxlength: [50, 'Breed cannot exceed 50 characters']
  },
  age: {
    type: String,
    trim: true,
    maxlength: [20, 'Age cannot exceed 20 characters']
  },
  weight: {
    type: String,
    trim: true,
    maxlength: [20, 'Weight cannot exceed 20 characters']
  },
  symptoms: {
    type: String,
    trim: true,
    maxlength: [1000, 'Symptoms cannot exceed 1000 characters']
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Treatment cannot exceed 1000 characters']
  },
  prescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Prescription cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    default: Date.now
  },
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for demo mode
  },
  veterinarianName: {
    type: String,
    required: [true, 'Veterinarian name is required']
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better performance
medicalRecordSchema.index({ owner: 1, visitDate: -1 });
medicalRecordSchema.index({ petName: 'text', symptoms: 'text', diagnosis: 'text' });
medicalRecordSchema.index({ veterinarian: 1 });

export default mongoose.model('MedicalRecord', medicalRecordSchema);