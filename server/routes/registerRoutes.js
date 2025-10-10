import express from 'express';
import multer from 'multer';
import path from 'path';


import { 
    savePetOwnerRegisterData, 
    petOwnerLoginFromRegister, 
    getAllRegisterData, 
    getRegisterDataById, 
    updateRegisterData, 
    deleteRegisterData,
    resetRegisterPassword, 
    deleteSelfRegister,
    changeRegisterPassword,
    registers
} from '../Controllers/registerController.js';


import { authenticateToken, requireAdmin } from '../middleware/auth.js';

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


router.post('/register', savePetOwnerRegisterData);
router.post('/login', petOwnerLoginFromRegister);
router.post('/registers', registers);
router.get('/all-public', getAllRegisterData);


router.use(authenticateToken);


// Place static routes before parameterized routes to avoid collisions
router.put('/profile/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const RegisterModel = (await import('../Model/Register.js')).default;
        const userId = req.user._id;
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        const updatedUser = await RegisterModel.findByIdAndUpdate(
            userId,
            { avatarUrl },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            data: {
                // return the full user object (minus password) so client state isn't wiped
                user: updatedUser
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

router.get('/profile/:id', getRegisterDataById);
router.put('/profile/:id', updateRegisterData);
router.post('/profile/reset-password', async (req, res, next) => {
    return resetRegisterPassword(req, res, next);
});
router.post('/profile/change-password', async (req, res, next) => {
    return changeRegisterPassword(req, res, next);
});
router.delete('/profile/self', async (req, res, next) => {
    return deleteSelfRegister(req, res, next);
});
// (avatar route moved above)


router.get('/all', requireAdmin, getAllRegisterData);
router.delete('/:id', requireAdmin, deleteRegisterData);


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
