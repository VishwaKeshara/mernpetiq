import RegisterModel from '../Model/Register.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

// Save Pet Owner Registration Data
const savePetOwnerRegisterData = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine1, addressLine2, city, state, postalCode, country, dateOfBirth } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Validate name
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Name can only contain letters and spaces'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Validate phone if provided
        if (phone && phone.trim()) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid phone number'
                });
            }
        }

        // Validate date of birth if provided
        if (dateOfBirth) {
            const birthDate = new Date(dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 13 || age > 120) {
                return res.status(400).json({
                    success: false,
                    message: 'You must be at least 13 years old to register'
                });
            }
        }

        // Validate postal code if provided
        if (postalCode && postalCode.trim()) {
            const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
            if (!postalRegex.test(postalCode.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid postal code'
                });
            }
        }

        // Check if user already exists
        const existingUser = await RegisterModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new pet owner data
        const newPetOwnerData = new RegisterModel({
            name,
            email,
            password,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            dateOfBirth,
            isActive: true
        });

        // Save to MongoDB register collection
        const savedPetOwner = await newPetOwnerData.save();

        // Generate JWT token
        const token = generateToken(savedPetOwner._id);

        // Return success response with saved data
        res.status(201).json({
            success: true,
            message: 'Pet owner registered successfully',
            data: {
                id: savedPetOwner._id,
                name: savedPetOwner.name,
                email: savedPetOwner.email,
                isActive: savedPetOwner.isActive,
                phone: savedPetOwner.phone,
                addressLine1: savedPetOwner.addressLine1,
                addressLine2: savedPetOwner.addressLine2,
                city: savedPetOwner.city,
                state: savedPetOwner.state,
                postalCode: savedPetOwner.postalCode,
                country: savedPetOwner.country,
                dateOfBirth: savedPetOwner.dateOfBirth,
                createdAt: savedPetOwner.createdAt,
                token: token
            }
        });

    } catch (error) {
        console.error('Save pet owner register data error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while saving pet owner data'
        });
    }
};

// Pet Owner Login from Register Collection
const petOwnerLoginFromRegister = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find user by email in register collection
        const user = await RegisterModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Return user data (excluding password) and token
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            phone: user.phone,
            addressLine1: user.addressLine1,
            addressLine2: user.addressLine2,
            city: user.city,
            state: user.state,
            postalCode: user.postalCode,
            country: user.country,
            dateOfBirth: user.dateOfBirth,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Pet owner login successful',
            data: {
                user: userData,
                token
            }
        });

    } catch (error) {
        console.error('Pet owner login from register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during pet owner login'
        });
    }
};

// Get All Register Data
const getAllRegisterData = async (req, res) => {
    try {
        const allAdmins = await RegisterModel.find({}).select('-password');
        
        res.status(200).json({
            success: true,
            message: 'All register data retrieved successfully',
            data: {
                admins: allAdmins,
                total: allAdmins.length
            }
        });

    } catch (error) {
        console.error('Get all register data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving register data from MongoDB'
        });
    }
};

// Get Register Data by ID
const getRegisterDataById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const admin = await RegisterModel.findById(id).select('-password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Register data not found in MongoDB'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Register data retrieved successfully',
            data: {
                admin: admin
            }
        });

    } catch (error) {
        console.error('Get register data by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving register data from MongoDB'
        });
    }
};

// Update Register Data
const updateRegisterData = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body || {};

        // Remove password from update data if present
        if (updateData.password) {
            delete updateData.password;
        }

        // Only allow updating fields that exist in the schema
        const allowedFields = [
            'name', 'email', 'avatarUrl', 'phone', 'addressLine1', 'addressLine2',
            'city', 'state', 'postalCode', 'country', 'dateOfBirth', 'isActive'
        ];
        const filteredUpdate = {};
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) filteredUpdate[key] = updateData[key];
        }

        const updatedUser = await RegisterModel.findByIdAndUpdate(
            id,
            filteredUpdate,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Register data not found in MongoDB'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Register data updated successfully in MongoDB',
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        console.error('Update register data error:', error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while updating register data in MongoDB'
        });
    }
};

// Delete Register Data
const deleteRegisterData = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedAdmin = await RegisterModel.findByIdAndDelete(id);
        
        if (!deletedAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Register data not found in MongoDB'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Register data deleted successfully from MongoDB',
            data: {
                deletedAdmin: {
                    id: deletedAdmin._id,
                    name: deletedAdmin.name,
                    email: deletedAdmin.email,
                    role: deletedAdmin.role
                }
            }
        });

    } catch (error) {
        console.error('Delete register data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting register data from MongoDB'
        });
    }
};

// Registers Query - Save Register Data
const registers = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine1, addressLine2, city, state, postalCode, country, dateOfBirth } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await RegisterModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new register data
        const newRegisterData = new RegisterModel({
            name,
            email,
            password,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            dateOfBirth,
            isActive: true
        });

        // Save to MongoDB
        const savedRegister = await newRegisterData.save();

        // Generate JWT token
        const token = generateToken(savedRegister._id);

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Register data saved successfully',
            data: {
                id: savedRegister._id,
                name: savedRegister.name,
                email: savedRegister.email,
                phone: savedRegister.phone,
                addressLine1: savedRegister.addressLine1,
                addressLine2: savedRegister.addressLine2,
                city: savedRegister.city,
                state: savedRegister.state,
                postalCode: savedRegister.postalCode,
                country: savedRegister.country,
                dateOfBirth: savedRegister.dateOfBirth,
                isActive: savedRegister.isActive,
                createdAt: savedRegister.createdAt,
                token: token
            }
        });

    } catch (error) {
        console.error('Registers query error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while saving register data'
        });
    }
};

export {
    savePetOwnerRegisterData,
    petOwnerLoginFromRegister,
    getAllRegisterData,
    getRegisterDataById,
    updateRegisterData,
    deleteRegisterData,
    registers
};

// Reset Pet Owner Password (returns the new password in response)
export const resetRegisterPassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { newPassword } = req.body || {};

        const generated = newPassword && newPassword.length >= 6
            ? newPassword
            : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(generated, salt);

        const updated = await RegisterModel.findByIdAndUpdate(
            userId,
            { password: hashed },
            { new: true }
        ).select('-password');

        if (!updated) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: { newPassword: generated }
        });
    } catch (error) {
        console.error('Reset register password error:', error);
        return res.status(500).json({ success: false, message: 'Server error while resetting password' });
    }
};

// Self delete pet owner account
export const deleteSelfRegister = async (req, res) => {
    try {
        const userId = req.user._id;
        const deleted = await RegisterModel.findByIdAndDelete(userId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Self delete register error:', error);
        return res.status(500).json({ success: false, message: 'Server error while deleting account' });
    }
};

// Change Pet Owner Password (with current password verification)
export const changeRegisterPassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Current and new password (>=6 chars) are required' });
        }

        const user = await RegisterModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change register password error:', error);
        return res.status(500).json({ success: false, message: 'Server error while changing password' });
    }
};
