import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  LogOut,
  FileText,
  Clock,
  PlusCircle,
  MessageSquare,
  HelpCircle,
  Settings,
  Home,
} from "lucide-react";
import { handleLogout } from "../../utils/logout";
import { API_URL } from "../../config";

function SideNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [profileModal, setProfileModal] = useState(false);

  const [oldUsername, setOldUserName] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newPass, setNewPass] = useState("");

  const username = localStorage.getItem("citizen_username") || "Citizen";
  const uid = localStorage.getItem("uid") || "N/A";

  const logout = () => handleLogout(navigate);

  const newUserData = {
    oldUsername,
    newUsername: newUserName,
    newpassword: newPass,
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });

      if (res.ok) {
        alert("✅ Profile updated successfully!");
        setProfileModal(false);
        navigate("/login");
      } else {
        alert("❌ Failed to update profile.");
      }
    } catch (err) {
      // Handle profile update error silently
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      // If we are not on the dashboard, navigate there and then scroll
      navigate("/citizen/dashboard");
      // Give time for the page to load before scrolling
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  const navItems = [
    { label: "Home", icon: Home, action: () => navigate("/citizen/dashboard") },
    { label: "File Complaint", icon: PlusCircle, action: () => scrollToSection("complaint-section") },
    { label: "Track Status", icon: Clock, action: () => navigate("/track-status") },
    { label: "My Complaints", icon: FileText, action: () => navigate("/my-complaints") },
    { label: "Feedback", icon: MessageSquare, action: () => scrollToSection("history-section") },
    { label: "Support", icon: HelpCircle, action: () => alert("Contact civic.helpdesk@gov.in") },
  ];


  return (
    <div>
      {/* 🔹 Update Profile Modal */}
      {profileModal && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
            <h2 className="text-lg font-semibold text-indigo-600 mb-4">
              Update Your Profile
            </h2>
            <input
              onChange={(e) => setOldUserName(e.target.value)}
              className="w-full mb-3 border rounded-md p-2 text-sm focus:border-indigo-400"
              type="text"
              placeholder="Enter Old Username"
            />
            <input
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full mb-3 border rounded-md p-2 text-sm focus:border-indigo-400"
              type="text"
              placeholder="Enter New Username"
            />
            <input
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full mb-4 border rounded-md p-2 text-sm focus:border-indigo-400"
              type="password"
              placeholder="Enter New Password"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={updateProfile}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Update
              </button>
              <button
                onClick={() => setProfileModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Navbar Toggle */}
      <div className="absolute w-full shadow-sm p-3 bg-white z-10 flex items-center">
        <button onClick={() => setOpen(!open)} className="text-gray-700">
          <Menu size={22} />
        </button>
      </div>

      {/* 🔹 Sidebar */}
      {open && (
        <div className="w-80 h-screen fixed bg-white border-r border-gray-200 shadow-sm pt-14 flex flex-col justify-between">
          {/* User Section */}
          <div>
            <div className="flex flex-col items-center border-b border-gray-100 pb-6">
              <div className="bg-indigo-100 text-indigo-600 rounded-full p-3 mt-4">
                <User size={28} />
              </div>
              <h2 className="mt-2 text-lg font-semibold text-gray-800">
                {username}
              </h2>
              <p className="text-xs text-gray-500">UID: {uid}</p>
              <button
                onClick={() => setProfileModal(true)}
                className="mt-2 text-xs text-indigo-500 hover:text-indigo-700"
              >
                ✎ Edit Profile
              </button>
              <p className="mt-2 px-3 py-1 bg-indigo-500 text-white text-xs rounded-full">
                Role: Citizen
              </p>
            </div>

            {/* Nav Options */}
            <div className="mt-6 flex flex-col gap-1">
              {navItems.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center gap-3 py-3 px-6 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 p-4">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SideNav;
