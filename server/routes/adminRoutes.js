import express from 'express';
import multer from 'multer';
import path from 'path';


import {
    saveAdminLoginData as adminRegister,
    adminLogin,
    getAdminDataById as getProfile,
    updateAdminData as updateProfile,
    resetAdminPassword,
    changeAdminPassword,
    deleteSelfAdmin
} from '../Controllers/adminDataController.js';


import { authenticateToken, requireAdmin, requireStaff } from '../middleware/auth.js';

const router = express.Router();


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
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
    
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});


router.post('/register', adminRegister);
router.post('/login', adminLogin);


router.use(authenticateToken); 


router.get('/profile/:id', getProfile);
router.put('/profile/:id', updateProfile);
router.post('/profile/reset-password', async (req, res, next) => {
 
    return resetAdminPassword(req, res, next);
});
router.post('/profile/change-password', async (req, res, next) => {
    return changeAdminPassword(req, res, next);
});
router.delete('/profile/self', async (req, res, next) => {
    return deleteSelfAdmin(req, res, next);
});
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




router.get('/admin/dashboard', requireAdmin, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to admin dashboard',
        data: {
            user: req.user,
            dashboard: {
                totalEmployees: 0, 
                activeEmployees: 0,
                recentActivity: []
            }
        }
    });
});


router.get('/staff/dashboard', requireStaff, (req, res) => {
    res.status(200).json({
        success: true,
        message: `Welcome to ${req.user.role} dashboard`,
        data: {
            user: req.user,
            dashboard: {
                role: req.user.role,
                permissions: getRolePermissions(req.user.role)
            }
        }
    });
});


function getRolePermissions(role) {
    const permissions = {
        admin: ['read', 'write', 'delete', 'manage_users', 'view_reports'],
        veterinarian: ['read', 'write', 'view_patients', 'manage_appointments', 'view_medical_records'],
        nurse: ['read', 'write', 'view_patients', 'manage_appointments'],
        receptionist: ['read', 'write', 'manage_appointments', 'manage_customers']
    };
    
    return permissions[role] || [];
}


router.post('/logout', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});


router.get('/verify-token', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                avatarUrl: req.user.avatarUrl,
                isActive: req.user.isActive
            }
        }
    });
});

export default router;
