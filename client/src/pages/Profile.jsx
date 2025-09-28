import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const defaultAvatar = "/assets/default-avatar.png";

export default function Profile() {
  const { user, updateUserContext, logout } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", email: user.email || "" });
      setPreview(user?.avatarUrl && user.avatarUrl.trim() !== "" ? user.avatarUrl : null);
    }
  }, [user]);

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      if (fileRef.current?.files?.[0]) {
        formData.append("avatar", fileRef.current.files[0]);
      }

      const res = await axios.put(
        `http://localhost:3001/update-profile/${user._id}`,
        formData
      );

      // backend returns updated user object
      if (res?.data) {
        updateUserContext(res.data);
        setPreview(res.data.avatarUrl || null);
        setMsg("Profile updated!");
      }
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setMsg("Password change not implemented");
  };

  const avatarSrc =
    preview || (user?.avatarUrl && user.avatarUrl.trim() !== "" ? user.avatarUrl : defaultAvatar);

  return (
    <div className="min-h-screen bg-yellow-50 py-16">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-yellow-700">My Profile</h1>
          <button
            onClick={logout}
            className="text-sm bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600"
          >
            Logout
          </button>
        </div>

        {msg && <div className="mb-4 text-green-700 font-semibold">{msg}</div>}

        <div className="flex items-center gap-6 mb-10">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src={avatarSrc}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover shadow-lg"
          />

          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600"
            >
              Change Avatar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarPick}
            />
            <p className="text-xs text-gray-500 mt-2">JPG/PNG up to ~2MB recommended.</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Full Name</label>
            <input
              className="w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="bg-yellow-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </form>

        <div className="my-10 h-px bg-gray-200" />

        <form onSubmit={handleChangePassword} className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              className="w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="md:col-span-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="bg-yellow-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-yellow-600"
            >
              Change Password
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
