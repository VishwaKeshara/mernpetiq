import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:3001/register", { name, email, password })
      .then((result) => {
        console.log(result);
        navigate("/login"); 
      })
      .catch((err) => {
        console.log(err);
        setError("Failed to register. Please try again.");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <div className="bg-white rounded-3xl shadow-2xl flex max-w-4xl w-full overflow-hidden">
        <div className="w-1/2 hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1605460375648-278bcbd579a6?auto=format&fit=crop&w=800&q=80"
            alt="Pets"
            className="h-full w-full object-cover"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2 p-10 md:p-16 relative"
        >
          <h2 className="text-3xl font-bold mb-6 text-yellow-600">
            Create Account
          </h2>

          {error && (
            <div className="text-red-600 mb-4 font-semibold">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                name="name"
                value={name}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2 placeholder-transparent transition-colors"
                placeholder="Full Name"
                onChange={(e) => setName(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                value={email}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2 placeholder-transparent transition-colors"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Email
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                name="password"
                value={password}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-yellow-500 outline-none p-2 placeholder-transparent transition-colors"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="absolute left-0 -top-3 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Password
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
            >
              Register
            </motion.button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <span
              className="text-yellow-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Signup;
