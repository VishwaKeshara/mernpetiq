import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    saveAdminLoginData,
    adminLogin,
    getAllAdminData,
    getAdminDataById,
    updateAdminData,
    deleteAdminData,
    searchAdminData
} from '../Controllers/adminDataController.js';


import { authenticateToken, requireAdmin } from '../middleware/auth.js';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {

        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const router = express.Router();


router.post('/save-admin-login', saveAdminLoginData);
router.post('/admin-login', adminLogin);


router.use(authenticateToken);


router.get('/all', requireAdmin, getAllAdminData);


router.get('/:id', getAdminDataById);


router.put('/:id', updateAdminData);


router.put('/profile/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const EmployeeModel = (await import('../models/Employees.js')).default;
        const userId = req.user._id;
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        const updatedUser = await EmployeeModel.findByIdAndUpdate(
            userId,
            { avatarUrl },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            data: {
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    avatarUrl: updatedUser.avatarUrl,
                    isActive: updatedUser.isActive,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Avatar update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating avatar'
        });
    }
});


router.delete('/:id', requireAdmin, deleteAdminData);


router.get('/search/query', searchAdminData);

export default router;
