import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { API_URL } from "../config";
import toast, { Toaster } from "react-hot-toast";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    role: "",
    name: "",
    email: "",
    uid: "",
    username: "",
    pass: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(
          (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-base">🎉 Registration Successful!</span>
              <span className="text-sm text-gray-600">Welcome! Redirecting to login...</span>
            </div>
          ),
          {
            duration: 2500,
            style: {
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              color: "#fff",
              borderRadius: "12px",
              padding: "16px 20px",
              boxShadow: "0 8px 30px rgba(79,70,229,0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#4f46e5" },
          }
        );
        setTimeout(() => navigate("/login"), 2500);
      } else if (res.status === 400) {
        toast.error("⚠️ User already exists! Try a different username.", {
          style: { background: "#fef2f2", color: "#991b1b", borderRadius: "10px" },
        });
      } else {
        toast.error("❌ Something went wrong. Please try again.");
      }
    } catch (err) {
      toast.error("🔴 Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Toaster position="top-center" />
      {/* Left Branding Section */}
      <div className="hidden md:flex w-1/2 animated-gradient-bg justify-center items-center relative overflow-hidden">
        <div className="text-center px-6">
          <h1 className="text-white text-4xl font-bold mb-2">
            Citizen Grievance Portal
          </h1>
          <p className="text-indigo-100 text-sm font-light mb-6">
            Register to raise issues, track progress, and help build a better
            community.
          </p>
          <Link to="/login">
            <button className="px-6 py-2 rounded-md bg-white text-indigo-700 font-semibold hover:bg-indigo-100 transition">
              Login
            </button>
          </Link>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -bottom-32 -left-40 w-80 h-80 border-4 border-indigo-300 border-opacity-20 rounded-full" />
        <div className="absolute -top-40 -right-20 w-96 h-96 border-4 border-indigo-200 border-opacity-20 rounded-full" />
      </div>

      {/* Right Form Section */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
            Create Your Account 📝
          </h2>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Join us to file, track, and resolve civic grievances
          </p>

          {/* Role Selection */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4">
            <select
              onChange={handleChange}
              name="role"
              className="w-full outline-none text-gray-700 text-sm bg-transparent"
              required
            >
              <option value="">Select your role</option>
              <option value="citizen">Citizen</option>
              <option value="officer">Department Officer</option>
              <option value="admin">Admin</option>
            </select>

          </div>

          {/* Full Name */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4">
            <input
              onChange={handleChange}
              name="name"
              type="text"
              className="w-full outline-none text-sm text-gray-700"
              placeholder="Full Name"
              required
            />
          </div>

          {/* Email */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4">
            <input
              onChange={handleChange}
              name="email"
              type="email"
              className="w-full outline-none text-sm text-gray-700"
              placeholder="Email Address"
              required
            />
          </div>

          {/* UID / ID Number */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4">
            <input
              onChange={handleChange}
              name="uid"
              type="text"
              className="w-full outline-none text-sm text-gray-700"
              placeholder="Citizen ID / UID"
              required
            />
          </div>

          {/* Username */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4">
            <input
              onChange={handleChange}
              name="username"
              type="text"
              className="w-full outline-none text-sm text-gray-700"
              placeholder="Set Username"
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4">
            <input
              onChange={handleChange}
              name="pass"
              type="password"
              className="w-full outline-none text-sm text-gray-700"
              placeholder="Create Password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-sm font-semibold transition ${
              loading && "opacity-70 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" /> Registering...
              </>
            ) : (
              "Register"
            )}
          </button>

          {/* Login Redirect */}
          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-sm text-indigo-500 hover:text-indigo-700"
            >
              Already have an account? Login →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
