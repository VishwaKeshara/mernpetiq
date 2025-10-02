import express from 'express';
import { body, validationResult, query } from 'express-validator';
import {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getOwnerPets,
  getMedicalRecordStats
} from '../Controllers/medicalRecordController.js';

const router = express.Router();

// Validation middleware for medical records
const validateMedicalRecord = [
  body('petName').trim().notEmpty().withMessage('Pet name is required'),
  body('ownerEmail').isEmail().normalizeEmail().withMessage('Valid owner email is required'),
  body('petType').isIn(['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other']).withMessage('Invalid pet type'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required'),
  body('breed').optional().trim().isLength({ max: 50 }).withMessage('Breed cannot exceed 50 characters'),
  body('age').optional().trim().isLength({ max: 20 }).withMessage('Age cannot exceed 20 characters'),
  body('weight').optional().trim().isLength({ max: 20 }).withMessage('Weight cannot exceed 20 characters'),
  body('symptoms').optional().trim().isLength({ max: 1000 }).withMessage('Symptoms cannot exceed 1000 characters'),
  body('diagnosis').optional().trim().isLength({ max: 1000 }).withMessage('Diagnosis cannot exceed 1000 characters'),
  body('treatment').optional().trim().isLength({ max: 1000 }).withMessage('Treatment cannot exceed 1000 characters'),
  body('prescription').optional().trim().isLength({ max: 1000 }).withMessage('Prescription cannot exceed 1000 characters'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters')
];

const validateUpdateMedicalRecord = [
  body('petName').optional().trim().notEmpty().withMessage('Pet name cannot be empty'),
  body('petType').optional().isIn(['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other']).withMessage('Invalid pet type'),
  body('visitDate').optional().isISO8601().withMessage('Valid visit date is required'),
  body('breed').optional().trim().isLength({ max: 50 }).withMessage('Breed cannot exceed 50 characters'),
  body('age').optional().trim().isLength({ max: 20 }).withMessage('Age cannot exceed 20 characters'),
  body('weight').optional().trim().isLength({ max: 20 }).withMessage('Weight cannot exceed 20 characters'),
  body('symptoms').optional().trim().isLength({ max: 1000 }).withMessage('Symptoms cannot exceed 1000 characters'),
  body('diagnosis').optional().trim().isLength({ max: 1000 }).withMessage('Diagnosis cannot exceed 1000 characters'),
  body('treatment').optional().trim().isLength({ max: 1000 }).withMessage('Treatment cannot exceed 1000 characters'),
  body('prescription').optional().trim().isLength({ max: 1000 }).withMessage('Prescription cannot exceed 1000 characters'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('petType').optional().isIn(['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other']),
  query('status').optional().isIn(['active', 'completed', 'archived'])
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Routes
router.post('/', /*auth, authorize('vet'),*/ validateMedicalRecord, handleValidationErrors, createMedicalRecord);
router.get('/', /*auth,*/ validateQueryParams, handleValidationErrors, getMedicalRecords);
router.get('/stats', /*auth,*/ getMedicalRecordStats);
router.get('/owner/:ownerId/pets', /*auth,*/ getOwnerPets);
router.get('/:id', /*auth,*/ getMedicalRecord);
router.put('/:id', /*auth, authorize('vet'),*/ validateUpdateMedicalRecord, handleValidationErrors, updateMedicalRecord);
router.delete('/:id', /*auth, authorize('vet'),*/ deleteMedicalRecord);

export default router;