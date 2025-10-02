import MedicalRecord from '../Model/MedicalRecord.js';
import User from '../Model/User.js';
import mongoose from 'mongoose';

// @desc    Create new medical record
// @route   POST /api/medical-records
// @access  Private (Vet only)
const createMedicalRecord = async (req, res) => {
  try {
    const { ownerEmail, ...recordData } = req.body;

    // Find or create owner by email (demo mode without auth)
    let owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      owner = await User.create({
        name: ownerEmail.split('@')[0],
        email: ownerEmail,
        role: 'owner',
        password: 'temporary',
        isActive: true
      });
    }

    // Create medical record
    const medicalRecord = new MedicalRecord({
      ...recordData,
      owner: owner._id,
      ownerName: owner.name,
      veterinarian: null, // No vet auth in demo mode
      veterinarianName: 'Demo Vet'
    });

    await medicalRecord.save();
    await medicalRecord.populate('owner', 'name email');
    await medicalRecord.populate('veterinarian', 'name email');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: medicalRecord
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating medical record'
    });
  }
};

// @desc    Get medical records (filtered by role)
// @route   GET /api/medical-records
// @access  Private
const getMedicalRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    
    // In demo mode without auth, show all records

    // Apply filters
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    if (req.query.petType) {
      query.petType = req.query.petType;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .populate('owner', 'name email phone')
        .populate('veterinarian', 'name email')
        .sort({ visitDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MedicalRecord.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: records,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medical records'
    });
  }
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
const getMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('owner', 'name email phone address')
      .populate('veterinarian', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check permissions
    // Demo mode: skip owner permission check

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medical record'
    });
  }
};

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Vet only)
const updateMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Update record
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('owner', 'name email').populate('veterinarian', 'name email');

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating medical record'
    });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Vet only)
const deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting medical record'
    });
  }
};

// @desc    Get unique pets for an owner
// @route   GET /api/medical-records/owner/:ownerId/pets
// @access  Private
const getOwnerPets = async (req, res) => {
  try {
    // Check permissions
    if (req.user.role === 'owner' && req.params.ownerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const pets = await MedicalRecord.aggregate([
      { $match: { owner: mongoose.Types.ObjectId(req.params.ownerId) } },
      {
        $group: {
          _id: '$petName',
          petType: { $first: '$petType' },
          breed: { $first: '$breed' },
          lastVisit: { $max: '$visitDate' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { lastVisit: -1 } }
    ]);

    res.json({
      success: true,
      data: pets
    });
  } catch (error) {
    console.error('Get owner pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pets'
    });
  }
};

// @desc    Get medical record statistics
// @route   GET /api/medical-records/stats
// @access  Private
const getMedicalRecordStats = async (req, res) => {
  try {
    let query = {};
    
    // If owner, only show their records
    // Demo mode: no per-user filter

    const [
      totalRecords,
      todayRecords,
      recordsWithPrescriptions,
      recordsByPetType
    ] = await Promise.all([
      MedicalRecord.countDocuments(query),
      MedicalRecord.countDocuments({
        ...query,
        visitDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      MedicalRecord.countDocuments({
        ...query,
        prescription: { $exists: true, $ne: '' }
      }),
      MedicalRecord.aggregate([
        { $match: query },
        { $group: { _id: '$petType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        todayRecords,
        recordsWithPrescriptions,
        recordsByPetType
      }
    });
  } catch (error) {
    console.error('Get medical record stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

export {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getOwnerPets,
  getMedicalRecordStats
};