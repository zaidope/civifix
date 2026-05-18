import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import React, { Suspense, lazy, useMemo } from "react";

import CitizenNavbar from "./Components/Navbar";
import ParticleBackground from "./Components/ParticleBackground";

const Hero = lazy(() => import("./Components/home/Hero"));
const About = lazy(() => import("./Components/About"));
const Contact = lazy(() => import("./Components/Contact"));
const MlaDirectory = lazy(() => import("./Components/MlaDirectory"));
const UlbDirectory = lazy(() => import("./Components/UlbDirectory"));
const Login = lazy(() => import("./Components/Login"));
const Register = lazy(() => import("./Components/Register"));
const TrackStatus = lazy(() => import("./Components/TrackStatus"));

const CitizenDashboard = lazy(() => import("./Components/Dashboard/Dashboard"));
const AdminDashboard = lazy(() => import("./Components/Dashboard/AdminDashboard"));
const OfficerDashboard = lazy(() => import("./Components/Dashboard/ResolverDashboard"));
const MyComplaints = lazy(() => import("./Components/Dashboard/MyComplaints"));

const DASHBOARD_PREFIXES = ["/citizen/", "/officer/", "/admin/", "/my-complaints"];

function PageLoader() {
  return (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center">
      <div className="rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600 animate-spin" />
      <p className="mt-3 text-sm font-medium text-indigo-600">Loading…</p>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isDashboard = useMemo(
    () => DASHBOARD_PREFIXES.some((p) => location.pathname.startsWith(p)),
    [location.pathname]
  );
  const showParticles = !isDashboard;

  return (
    <div className="App bg-gray-50 relative" style={{ minHeight: "100vh" }}>
      {showParticles && <ParticleBackground />}

      <CitizenNavbar />

      <div className={`${isHome ? "" : "pt-20 lg:pt-24"} min-h-screen`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mla-directory" element={<MlaDirectory />} />
            <Route path="/authorities" element={<UlbDirectory />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/track-status" element={<TrackStatus />} />
            <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
            <Route path="/my-complaints" element={<MyComplaints />} />
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#363636", color: "#fff" },
          success: {
            duration: 3000,
            iconTheme: { primary: "#4ade80", secondary: "#fff" },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
