import React, { useState, useEffect } from 'react';
import { FaPaw, FaSave, FaEdit, FaTrash, FaPlus, FaCalendar, FaWeight, FaHeart } from 'react-icons/fa';

const PetProfile = () => {
    const [pets, setPets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        weight: '',
        color: '',
        gender: 'Male',
        dateOfBirth: '',
        microchipNumber: '',
        allergies: [],
        emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
        }
    });
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        
        if (user) {
            fetchPets(user._id);
        }
    }, []);

    const fetchPets = async (ownerId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/pets/owner/${ownerId}`);
            const data = await response.json();
            if (data.success) {
                setPets(data.data);
            }
        } catch (error) {
            console.error('Error fetching pets:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }

        try {
            const url = editingPet 
                ? `http://localhost:3000/api/pets/${editingPet._id}`
                : 'http://localhost:3000/api/pets';
            
            const method = editingPet ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    ownerId: currentUser._id
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert(editingPet ? 'Pet updated successfully!' : 'Pet created successfully!');
                setShowForm(false);
                setEditingPet(null);
                resetForm();
                fetchPets(currentUser._id);
            } else {
                alert(data.message || 'Error saving pet');
            }
        } catch (error) {
            console.error('Error saving pet:', error);
            alert('Error saving pet');
        }
    };

    const handleEdit = (pet) => {
        setEditingPet(pet);
        setFormData({
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            age: pet.age,
            weight: pet.weight,
            color: pet.color,
            gender: pet.gender,
            dateOfBirth: pet.dateOfBirth ? new Date(pet.dateOfBirth).toISOString().split('T')[0] : '',
            microchipNumber: pet.microchipNumber || '',
            allergies: pet.allergies || [],
            emergencyContact: pet.emergencyContact || {
                name: '',
                phone: '',
                relationship: ''
            }
        });
        setShowForm(true);
    };

    const handleDelete = async (petId) => {
        if (window.confirm('Are you sure you want to delete this pet profile?')) {
            try {
                const response = await fetch(`http://localhost:3000/api/pets/${petId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Pet deleted successfully!');
                    fetchPets(currentUser._id);
                } else {
                    alert(data.message || 'Error deleting pet');
                }
            } catch (error) {
                console.error('Error deleting pet:', error);
                alert('Error deleting pet');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            species: 'Dog',
            breed: '',
            age: '',
            weight: '',
            color: '',
            gender: 'Male',
            dateOfBirth: '',
            microchipNumber: '',
            allergies: [],
            emergencyContact: {
                name: '',
                phone: '',
                relationship: ''
            }
        });
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPet(null);
        resetForm();
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-yellow-900 mb-4">Please Login First</h2>
                    <p className="text-yellow-800">You need to be logged in to manage pet profiles.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-yellow-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div
                    
                    
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-yellow-900 mb-4 flex items-center">
                        <FaPaw className="mr-3" />
                        Pet Profiles
                    </h1>
                    <p className="text-yellow-800">Manage your pets' information and medical records</p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-yellow-900">
                        Your Pets ({pets.length})
                    </h2>
                    <button
                        
                        
                        onClick={() => setShowForm(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    >
                        <FaPlus className="mr-2" />
                        Add New Pet
                    </button>
                </div>

                {showForm && (
                    <div
                        
                        
                        className="bg-white rounded-xl shadow-xl p-6 mb-8"
                    >
                        <h3 className="text-2xl font-bold text-yellow-900 mb-6">
                            {editingPet ? 'Edit Pet Profile' : 'Add New Pet Profile'}
                        </h3>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Pet Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Species *
                                </label>
                                <select
                                    name="species"
                                    value={formData.species}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                >
                                    <option value="Dog">Dog</option>
                                    <option value="Cat">Cat</option>
                                    <option value="Bird">Bird</option>
                                    <option value="Rabbit">Rabbit</option>
                                    <option value="Hamster">Hamster</option>
                                    <option value="Fish">Fish</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Breed *
                                </label>
                                <input
                                    type="text"
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Age (years) *
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Weight (kg) *
                                </label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Color *
                                </label>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Gender *
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Date of Birth *
                                </label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Microchip Number
                                </label>
                                <input
                                    type="text"
                                    name="microchipNumber"
                                    value={formData.microchipNumber}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Emergency Contact Name
                                </label>
                                <input
                                    type="text"
                                    name="emergencyContact.name"
                                    value={formData.emergencyContact.name}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Emergency Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    name="emergencyContact.phone"
                                    value={formData.emergencyContact.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                    Emergency Contact Relationship
                                </label>
                                <input
                                    type="text"
                                    name="emergencyContact.relationship"
                                    value={formData.emergencyContact.relationship}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4">
                                <button
                                    type="submit"
                                    
                                    
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg flex items-center"
                                >
                                    <FaSave className="mr-2" />
                                    {editingPet ? 'Update Pet' : 'Save Pet'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    
                                    
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map((pet) => (
                        <div
                            key={pet._id}
                            
                            
                            
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-yellow-900">{pet.name}</h3>
                                    <p className="text-yellow-700">{pet.species} • {pet.breed}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        
                                        
                                        onClick={() => handleEdit(pet)}
                                        className="text-yellow-600 hover:text-yellow-800"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        
                                        
                                        onClick={() => handleDelete(pet._id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-yellow-800">
                                <div className="flex items-center">
                                    <FaCalendar className="mr-2" />
                                    <span>Age: {pet.age} years</span>
                                </div>
                                <div className="flex items-center">
                                    <FaWeight className="mr-2" />
                                    <span>Weight: {pet.weight} kg</span>
                                </div>
                                <div className="flex items-center">
                                    <FaHeart className="mr-2" />
                                    <span>Gender: {pet.gender}</span>
                                </div>
                                <div>
                                    <span>Color: {pet.color}</span>
                                </div>
                                {pet.microchipNumber && (
                                    <div>
                                        <span>Microchip: {pet.microchipNumber}</span>
                                    </div>
                                )}
                            </div>

                            {pet.emergencyContact && pet.emergencyContact.name && (
                                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                                    <h4 className="font-semibold text-yellow-900 mb-1">Emergency Contact</h4>
                                    <p className="text-sm text-yellow-800">
                                        {pet.emergencyContact.name} ({pet.emergencyContact.relationship})
                                    </p>
                                    <p className="text-sm text-yellow-800">{pet.emergencyContact.phone}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {pets.length === 0 && !showForm && (
                    <div
                        
                        
                        className="text-center py-12"
                    >
                        <FaPaw className="text-6xl text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-yellow-900 mb-2">No Pets Yet</h3>
                        <p className="text-yellow-800 mb-6">Start by adding your first pet profile!</p>
                        <button
                            
                            
                            onClick={() => setShowForm(true)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg flex items-center mx-auto"
                        >
                            <FaPlus className="mr-2" />
                            Add Your First Pet
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PetProfile;
