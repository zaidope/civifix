import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AnimatedButton from "./AnimatedButton";
import { fadeInUp, fadeInLeft, fadeInRight } from "../utils/animations";
import { API_URL } from "../config";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uname: username, pass: pass }),
      });

      // ✅ Handle admin login (no JSON response)
      if (res.status === 201) {
        setMessage("👑 Welcome Admin!");
        setMessageType("success");
        localStorage.setItem("admin_username", username);
        setTimeout(() => navigate("/admin/dashboard"), 1500);
        return;
      }

      // ✅ Handle officer login (no JSON response)
      if (res.status === 202) {
        setMessage("⚙️ Welcome Department Officer!");
        setMessageType("success");
        localStorage.setItem("officer_name", username);
        setTimeout(() => navigate("/officer/dashboard"), 1500);
        return;
      }

      // ✅ Parse JSON only for citizen login or errors
      const data = await res.json();

      if (res.status === 200) {
        setMessage("✅ Welcome Citizen!");

        // 🔥 Store citizen details for later use
        if (data.uid) {
          localStorage.setItem("uid", data.uid);
        }
        localStorage.setItem("citizen_username", username);

        setMessageType("success");
        setTimeout(() => navigate("/citizen/dashboard"), 1500);
      } else {
        setMessage(`❌ ${data.msg || "Invalid username or password"}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage("❌ Something went wrong. Please try again later.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col md:flex-row"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
    >
      {/* Left Side (Brand) */}
      <motion.div 
        className="hidden md:flex w-1/2 animated-gradient-bg justify-center items-center relative overflow-hidden"
        variants={fadeInLeft}
      >
        <motion.div 
          className="text-center px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-white text-4xl font-bold mb-2">
            Citizen Grievance Portal
          </h1>
          <p className="text-indigo-100 text-sm font-light">
            Empowering citizens. Enabling transparent governance.
          </p>
        </motion.div>
        <motion.div 
          className="absolute -bottom-24 -left-24 w-64 h-64 border-4 border-indigo-300 border-opacity-20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute -top-32 -right-20 w-80 h-80 border-4 border-indigo-200 border-opacity-20 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Right Side (Form) */}
      <motion.div 
        className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white p-10"
        variants={fadeInRight}
      >
        <motion.form
          onSubmit={onSubmit}
          className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
            Welcome Back 👋
          </h2>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Sign in to continue to your dashboard
          </p>

          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-3 rounded-md text-center text-sm font-medium ${
              messageType === "success" 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {/* Username */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-4 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 5a7 7 0 00-7 7v1h14v-1a7 7 0 00-7-7z"
              />
            </svg>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-2 w-full text-sm text-gray-800 bg-transparent focus:outline-none focus:ring-0"
              placeholder="Enter Username"
              autoFocus
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center border border-gray-300 py-2 px-3 rounded-md mb-5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="password"
              name="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="pl-2 w-full text-sm text-gray-800 bg-transparent focus:outline-none focus:ring-0"
              placeholder="Enter Password"
              required
            />
          </div>

          {/* Login Button */}
          <AnimatedButton
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            className="w-full py-3 text-sm font-semibold"
          >
            {loading ? "Logging In..." : "Login"}
          </AnimatedButton>

          <div className="text-center mt-4">
            <a
              href="/register"
              className="text-sm text-indigo-500 hover:text-indigo-700"
            >
              Not registered? Click here to register →
            </a>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}

export default Login;