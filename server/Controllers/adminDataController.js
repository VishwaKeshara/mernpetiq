import EmployeeModel from '../Model/Employees.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';


const saveAdminLoginData = async (req, res) => {
    try {
        const { email, password, role, name } = req.body;

   
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and role are required'
            });
        }

      
        const validRoles = ['admin', 'veterinarian', 'nurse', 'receptionist'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: admin, veterinarian, nurse, receptionist'
            });
        }

      
        const existingUser = await EmployeeModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

    
        const newAdminData = new EmployeeModel({
            name: name || `Admin User ${Date.now()}`, // Default name if not provided
            email,
            password,
            role,
            isActive: true
        });

        
        const savedAdmin = await newAdminData.save();

        
        const token = generateToken(savedAdmin._id);

        
        res.status(201).json({
            success: true,
            message: 'Admin data saved successfully to MongoDB',
            data: {
                id: savedAdmin._id,
                name: savedAdmin.name,
                email: savedAdmin.email,
                role: savedAdmin.role,
                isActive: savedAdmin.isActive,
                createdAt: savedAdmin.createdAt,
                token: token
            }
        });

    } catch (error) {
        console.error('Save admin data error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while saving admin data to MongoDB'
        });
    }
};

// Get All Admin Data
const getAllAdminData = async (req, res) => {
    try {
        const allAdmins = await EmployeeModel.find({}).select('-password');
        
        res.status(200).json({
            success: true,
            message: 'All admin data retrieved successfully',
            data: {
                admins: allAdmins,
                total: allAdmins.length
            }
        });

    } catch (error) {
        console.error('Get all admin data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving admin data from MongoDB'
        });
    }
};

// Get Admin Data by ID
const getAdminDataById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const admin = await EmployeeModel.findById(id).select('-password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin data not found in MongoDB'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin data retrieved successfully',
            data: {
                admin: admin
            }
        });

    } catch (error) {
        console.error('Get admin data by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving admin data from MongoDB'
        });
    }
};

// Update Admin Data
const updateAdminData = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate required fields
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Validate name if provided
        if (updateData.name !== undefined) {
            if (!updateData.name || updateData.name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be at least 2 characters long'
                });
            }
            
            if (!/^[a-zA-Z\s]+$/.test(updateData.name.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Name can only contain letters and spaces'
                });
            }
        }

        // Validate email if provided
        if (updateData.email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }
        }

        // Remove password from update data
        delete updateData.password;

        // Only allow updating specific fields
        const allowedFields = [
            'name', 'email', 'avatarUrl', 'role', 'isActive'
        ];
        const filteredUpdate = {};
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                // Trim string values
                if (typeof updateData[key] === 'string') {
                    filteredUpdate[key] = updateData[key].trim();
                } else {
                    filteredUpdate[key] = updateData[key];
                }
            }
        }

        const updatedAdmin = await EmployeeModel.findByIdAndUpdate(
            id,
            filteredUpdate,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Admin data not found in MongoDB'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin data updated successfully in MongoDB',
            data: {
                admin: updatedAdmin
            }
        });

    } catch (error) {
        console.error('Update admin data error:', error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while updating admin data in MongoDB'
        });
    }
};


const deleteAdminData = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedAdmin = await EmployeeModel.findByIdAndDelete(id);
        
        if (!deletedAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Admin data not found in MongoDB'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin data deleted successfully from MongoDB',
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
        console.error('Delete admin data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting admin data from MongoDB'
        });
    }
};

// Search Admin Data
const searchAdminData = async (req, res) => {
    try {
        const { query, role, isActive } = req.query;
        
        let searchCriteria = {};
        
        // Build search criteria
        if (query) {
            searchCriteria.$or = [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (role) {
            searchCriteria.role = role;
        }
        
        if (isActive !== undefined) {
            searchCriteria.isActive = isActive === 'true';
        }

        const searchResults = await EmployeeModel.find(searchCriteria).select('-password');
        
        res.status(200).json({
            success: true,
            message: 'Admin data search completed successfully',
            data: {
                results: searchResults,
                total: searchResults.length,
                searchCriteria: searchCriteria
            }
        });

    } catch (error) {
        console.error('Search admin data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching admin data in MongoDB'
        });
    }
};

// Admin Login
const adminLogin = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and role are required'
            });
        }

        // Find user by email
        const user = await EmployeeModel.findOne({ email });
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

        // Check if user role matches the requested role
        if (user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `Access denied. This account is registered as ${user.role}, not ${role}`
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
        const { generateToken } = await import('../middleware/auth.js');
        const token = generateToken(user._id);

        // Return user data (excluding password) and token
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                token
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

export {
    saveAdminLoginData,
    adminLogin,
    getAllAdminData,
    getAdminDataById,
    updateAdminData,
    deleteAdminData,
    searchAdminData,
    getAllAdmins
};

// Reset Admin Password (returns the new password in response)
export const resetAdminPassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { newPassword } = req.body || {};

        // Generate a random strong password if not provided
        const generated = newPassword && newPassword.length >= 6
            ? newPassword
            : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(generated, salt);

        const updated = await EmployeeModel.findByIdAndUpdate(
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
        console.error('Reset admin password error:', error);
        return res.status(500).json({ success: false, message: 'Server error while resetting password' });
    }
};

// Change Admin Password (with current password verification)
export const changeAdminPassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Current and new password (>=6 chars) are required' });
        }

        const user = await EmployeeModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change admin password error:', error);
        return res.status(500).json({ success: false, message: 'Server error while changing password' });
    }
};

// Self delete admin/staff account
export const deleteSelfAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        const deleted = await EmployeeModel.findByIdAndDelete(userId);
        if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Self delete admin error:', error);
        return res.status(500).json({ success: false, message: 'Server error while deleting account' });
    }
};

// Get All Admins/Employees
const getAllAdmins = async (req, res) => {
    try {
        const { role, isActive, search } = req.query;
        
        let filter = {};
        
        // Add role filter if provided
        if (role) {
            filter.role = role;
        }
        
        // Add active status filter if provided
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        
        // Add search filter if provided
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const employees = await EmployeeModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Employees fetched successfully',
            data: {
                admins: employees,
                total: employees.length,
                active: employees.filter(emp => emp.isActive).length,
                inactive: employees.filter(emp => !emp.isActive).length
            }
        });
    } catch (error) {
        console.error('Get all admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching employees'
        });
    }
};
