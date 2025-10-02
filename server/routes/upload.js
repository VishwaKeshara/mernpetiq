const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, authorize } = require('../middleware/authMiddleware');
const MedicalRecord = require('../models/MedicalRecord');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, 'medical-records');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// @route   POST /api/upload/medical-record/:recordId
// @desc    Upload files to a medical record
// @access  Private (Vet only)
router.post('/medical-record/:recordId', 
  auth, 
  authorize('vet'), 
  upload.array('files', 5), 
  handleMulterError, 
  async (req, res) => {
    try {
      // Check if medical record exists
      const medicalRecord = await MedicalRecord.findById(req.params.recordId);
      if (!medicalRecord) {
        // Clean up uploaded files if record doesn't exist
        if (req.files) {
          req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Error deleting file:', err);
            });
          });
        }
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Process uploaded files
      const attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date()
      }));

      // Add attachments to medical record
      medicalRecord.attachments.push(...attachments);
      await medicalRecord.save();

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          recordId: medicalRecord._id,
          uploadedFiles: attachments
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error during file upload'
      });
    }
  }
);

// @route   POST /api/upload/general
// @desc    Upload general files (not attached to specific record)
// @access  Private (Vet only)
router.post('/general', 
  auth, 
  authorize('vet'), 
  upload.array('files', 5), 
  handleMulterError, 
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadDate: new Date(),
        uploadedBy: req.user._id
      }));

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles
      });
    } catch (error) {
      console.error('General upload error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error during file upload'
      });
    }
  }
);

// @route   GET /api/upload/file/:recordId/:filename
// @desc    Get uploaded file
// @access  Private
router.get('/file/:recordId/:filename', auth, async (req, res) => {
  try {
    const { recordId, filename } = req.params;

    // Check if user has permission to access this file
    const medicalRecord = await MedicalRecord.findById(recordId);
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check permissions
    if (req.user.role === 'owner' && medicalRecord.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists in record attachments
    const attachment = medicalRecord.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = path.join(uploadsDir, 'medical-records', filename);
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading file'
    });
  }
});

// @route   DELETE /api/upload/file/:recordId/:filename
// @desc    Delete uploaded file
// @access  Private (Vet only)
router.delete('/file/:recordId/:filename', auth, authorize('vet'), async (req, res) => {
  try {
    const { recordId, filename } = req.params;

    const medicalRecord = await MedicalRecord.findById(recordId);
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Find and remove attachment from record
    const attachmentIndex = medicalRecord.attachments.findIndex(att => att.filename === filename);
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found in record'
      });
    }

    medicalRecord.attachments.splice(attachmentIndex, 1);
    await medicalRecord.save();

    // Delete file from disk
    const filePath = path.join(uploadsDir, 'medical-records', filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file from disk:', err);
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting file'
    });
  }
});

// @route   GET /api/upload/files/:recordId
// @desc    Get all files for a medical record
// @access  Private
router.get('/files/:recordId', auth, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.recordId);
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check permissions
    if (req.user.role === 'owner' && medicalRecord.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: medicalRecord.attachments
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching files'
    });
  }
});

module.exports = router;