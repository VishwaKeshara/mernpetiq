import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
// import UserAppointments from "./components/UserAppointments"; // Component not found

// Removed external placeholder URL to avoid network errors

export default function Profile() {
  const { user, token, updateUserContext, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    dateOfBirth: ""
  });
  const [changePwd, setChangePwd] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  // Determine if this is a pet owner (no role) or staff/admin (has role)
  const isPetOwner = !user?.role;

  // Check if redirected from payment with success message
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      setActiveTab("appointments");
      setMsg(location.state.message || "Payment completed successfully!");
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      addressLine1: user.addressLine1 || "",
      addressLine2: user.addressLine2 || "",
      city: user.city || "",
      state: user.state || "",
      postalCode: user.postalCode || "",
      country: user.country || "",
      dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : ""
    });

    const avatarUrl = user?.avatarUrl;
    if (avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined" && avatarUrl.trim() !== "") {
      setPreview(avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:3000${avatarUrl}`);
    } else {
      setPreview(null);
    }
  }, [user]);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    
    // Debug authentication status
    console.log("User:", user);
    console.log("Token:", token);
    console.log("Is Pet Owner:", isPetOwner);
    
    if (!user || !token) {
      setMsg("Please log in to upload a profile picture");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const base = isPetOwner ? "register" : "admin";
      
      console.log("Uploading to:", `http://localhost:3000/api/${base}/profile/avatar`);
      console.log("Authorization header:", `Bearer ${token}`);
      
      const avatarRes = await axios.put(
        `http://localhost:3000/api/${base}/profile/avatar`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (avatarRes?.data?.success) {
        updateUserContext(avatarRes.data.data.user);
        setMsg("Profile photo updated.");
      } else {
        setMsg(avatarRes?.data?.message || "Failed to update photo");
      }
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Error response:", err.response?.data);
      setMsg(err.response?.data?.message || "Failed to update photo");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !token) return;
    setSaving(true);
    setMsg("");

    try {
      // Upload avatar if chosen
      if (fileRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append("avatar", fileRef.current.files[0]);
        const base = isPetOwner ? "register" : "admin";
        const avatarRes = await axios.put(
          `http://localhost:3000/api/${base}/profile/avatar`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (avatarRes?.data?.success) {
          updateUserContext(avatarRes.data.data.user);
        }
      }

      // Update profile fields
      const base2 = isPetOwner ? "register" : "admin";
      const userId = user?._id || user?.id;
      const res = await axios.put(
        `http://localhost:3000/api/${base2}/profile/${userId}`,
        isPetOwner
          ? {
              name: form.name,
              email: form.email,
              phone: form.phone,
              addressLine1: form.addressLine1,
              addressLine2: form.addressLine2,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode,
              country: form.country,
              dateOfBirth: form.dateOfBirth
            }
          : {
              name: form.name,
              email: form.email
            },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (res?.data?.success) {
        const updated = res.data.data.admin || res.data.data.user || res.data.data;
        updateUserContext(updated);
        setMsg("Profile updated successfully.");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const base = isPetOwner ? "register" : "admin";
      const res = await axios.post(
        `http://localhost:3000/api/${base}/profile/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.success) {
        setMsg(`Password has been reset. New password: ${res.data.data.newPassword}`);
      } else {
        setMsg(res?.data?.message || "Failed to reset password");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to reset password");
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!changePwd.currentPassword || !changePwd.newPassword || changePwd.newPassword.length < 6) {
        setMsg("Enter current password and a new password (>= 6 chars)");
        return;
      }
      const base = isPetOwner ? "register" : "admin";
      const res = await axios.post(
        `http://localhost:3000/api/${base}/profile/change-password`,
        { currentPassword: changePwd.currentPassword, newPassword: changePwd.newPassword },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (res?.data?.success) {
        setMsg("Password changed successfully.");
        setChangePwd({ currentPassword: "", newPassword: "" });
      } else {
        setMsg(res?.data?.message || "Failed to change password");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to change password");
    }
  };

  const handleDeleteProfile = async () => {
    try {
      setDeleting(true);
      setMsg("");
      
      const base = isPetOwner ? "register" : "admin";
      const res = await axios.delete(
        `http://localhost:3000/api/${base}/profile/self`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.success) {
        setMsg("Account deleted successfully. Redirecting to home page...");
        setTimeout(() => {
          logout();
          window.location.href = "/";
        }, 2000);
      } else {
        setMsg(res?.data?.message || "Failed to delete account");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show authentication status for debugging
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-yellow-50 py-10 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access your profile.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-yellow-700">My Profile</h1>
            <button onClick={logout} className="text-sm bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600">Logout</button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-white text-yellow-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Profile Settings
            </button>
            {isPetOwner && (
              <button
                onClick={() => setActiveTab("appointments")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "appointments"
                    ? "bg-white text-yellow-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                My Appointments
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Container */}
        <div>
          {/* Profile Tab Content */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {msg && (
                <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800 border border-green-200">{msg}</div>
              )}

              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  {preview ? (
              <img 
                src={preview} 
                alt="avatar" 
                className="w-24 h-24 rounded-full object-cover shadow" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }} 
                  />
                  ) : null}
                  <div 
              className={`w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center shadow ${preview ? 'hidden' : 'flex'}`}
            >
              <span className="text-yellow-800 text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  </div>
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">Change Avatar</button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                </div>
              </div>

              <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
          {isPetOwner && (
            <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Address</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Address 2</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
                </div>
              <div className="grid md:grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">City</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">State/Province</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                </div>
              </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Country</label>
                  <input className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" className="w-full border rounded-lg p-3 focus:border-yellow-500" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
            </>
          )}
                <div className="md:col-span-2 flex items-center gap-3 mt-2">
                  <button   type="submit" disabled={saving} className="bg-yellow-500 text-white px-6 py-3 rounded-xl shadow disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={handleResetPassword} className="bg-blue-500 text-white px-4 py-3 rounded-xl shadow hover:bg-blue-600">
                    Reset Password
                  </button>
                </div>
                <div className="md:col-span-2 grid md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                    <input type="password" className="w-full border rounded-lg p-3 focus:border-yellow-500" value={changePwd.currentPassword} onChange={(e) => setChangePwd({ ...changePwd, currentPassword: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">New Password</label>
                    <input type="password" className="w-full border rounded-lg p-3 focus:border-yellow-500" value={changePwd.newPassword} onChange={(e) => setChangePwd({ ...changePwd, newPassword: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <button type="button" onClick={handleChangePassword} className="bg-indigo-500 text-white px-4 py-3 rounded-xl shadow hover:bg-indigo-600">
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Delete Account Section */}
                <div className="md:col-span-2 mt-8 pt-6 border-t border-red-200">
                  <h3 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="bg-red-500 text-white px-4 py-3 rounded-xl shadow hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </form>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-red-700 mb-4">Delete Account</h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteProfile}
                        disabled={deleting}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Delete Account"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab Content */}
          {activeTab === "appointments" && isPetOwner && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">My Appointments</h3>
              <p className="text-gray-600">Appointments feature coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


