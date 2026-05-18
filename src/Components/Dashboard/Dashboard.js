import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  LogOut,
  User,
  Settings,
  ChevronRight,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";
import AddComplaintModal from "./AddComplaintModal";
import { handleLogout } from "../../utils/logout";
import { API_URL } from "../../config";

/* ═══════════════════════════════════════════════════════════════════
   CITIZEN DASHBOARD — Premium Modern Layout
   ═══════════════════════════════════════════════════════════════════ */

function Dashboard() {
  const navigate = useNavigate();
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const citizen = useMemo(() => ({
    username: localStorage.getItem("citizen_username") || "",
    uid: localStorage.getItem("uid") || "",
  }), []);

  // Auth guard
  useEffect(() => {
    if (!citizen.username || !citizen.uid) {
      navigate("/login");
    }
  }, [citizen, navigate]);

  // Fetch complaints
  useEffect(() => {
    if (!citizen.uid) return;
    fetch(`${API_URL}/history/${citizen.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [citizen.uid]);

  const stats = useMemo(() => {
    let pending = 0;
    let resolved = 0;
    let rejected = 0;
    for (const c of complaints) {
      if (c.status === "Resolved") resolved++;
      else if (c.status === "Not Able To Resolve" || c.status === "Rejected") rejected++;
      else if (
        c.status === "Submitted" ||
        c.status === "In Progress" ||
        c.status === "Under Progress"
      )
        pending++;
    }
    return {
      totalComplaints: complaints.length,
      pendingCount: pending,
      resolvedCount: resolved,
      rejectedCount: rejected,
    };
  }, [complaints]);

  const { totalComplaints, pendingCount, resolvedCount, rejectedCount } = stats;

  const getStatusColor = (status) => {
    if (status === "Resolved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "In Progress" || status === "Under Progress") return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "Submitted") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const logout = () => handleLogout(navigate);

  return (
    <>
      <div className="min-h-screen bg-[#f8f9fc]">

        {/* ─── TOP HEADER BAR ─── */}
        <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 backdrop-blur-lg bg-white/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">CiviFix</h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase -mt-0.5">Citizen Portal</p>
              </div>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/my-complaints")}
                className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors font-medium"
              >
                <FileText size={16} />
                My Complaints
              </button>
              <button
                onClick={() => navigate("/track-status")}
                className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors font-medium"
              >
                <Clock size={16} />
                Track Status
              </button>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {citizen.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-gray-700">{citizen.username}</span>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-800">{citizen.username}</p>
                      <p className="text-xs text-gray-400">UID: {citizen.uid}</p>
                    </div>
                    <button onClick={() => { setProfileOpen(false); navigate("/my-complaints"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      <FileText size={16} /> My Complaints
                    </button>
                    <button onClick={() => { setProfileOpen(false); navigate("/track-status"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      <Clock size={16} /> Track Status
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ─── MAIN CONTENT ─── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ─── WELCOME BANNER ─── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 sm:p-10 mb-8 shadow-xl shadow-indigo-200/50">
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">{greeting()},</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                  {citizen.username} 👋
                </h2>
                <p className="text-indigo-200/80 text-sm max-w-md">
                  Report civic issues, track their progress, and help make your community better. Your voice matters.
                </p>
              </div>
              <button
                onClick={() => setShowComplaintModal(true)}
                className="flex items-center gap-3 bg-white text-indigo-700 px-7 py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-indigo-800/20 hover:shadow-xl hover:shadow-indigo-800/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap group"
              >
                <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                File a Grievance
              </button>
            </div>
          </div>

          {/* ─── STATS CARDS ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Filed", value: totalComplaints, icon: FileText, color: "indigo", gradient: "from-indigo-500 to-indigo-600" },
              { label: "Pending", value: pendingCount, icon: Clock, color: "amber", gradient: "from-amber-500 to-orange-500" },
              { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "emerald", gradient: "from-emerald-500 to-green-500" },
              { label: "Rejected", value: rejectedCount, icon: AlertTriangle, color: "red", gradient: "from-red-500 to-rose-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                    <stat.icon size={18} className="text-white" />
                  </div>
                  <TrendingUp size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{loading ? "—" : stat.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ─── RECENT ACTIVITY ─── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your latest complaint submissions</p>
              </div>
              {complaints.length > 0 && (
                <button
                  onClick={() => navigate("/my-complaints")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
                >
                  View All
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-indigo-200 border-t-indigo-600" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-indigo-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-700 mb-1">No complaints yet</h4>
                <p className="text-sm text-gray-400 mb-6">File your first civic grievance and start making a difference.</p>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                >
                  <PlusCircle size={18} />
                  File a Complaint
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {complaints.slice(0, 5).map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      navigate("/my-complaints");
                    }}
                  >
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">
                        {c.category?.includes("Road") ? "🛣️" :
                         c.category?.includes("Water") ? "💧" :
                         c.category?.includes("Garbage") ? "🗑️" :
                         c.category?.includes("Electricity") ? "⚡" :
                         c.category?.includes("Health") ? "🏥" : "📋"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.category || "Uncategorized"}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {c.location && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <MapPin size={10} /> {c.location.length > 30 ? c.location.substring(0, 30) + "..." : c.location}
                          </span>
                        )}
                        {c.date && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Calendar size={10} /> {new Date(c.date).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── QUICK ACTIONS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <button
              onClick={() => setShowComplaintModal(true)}
              className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <PlusCircle size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">New Complaint</p>
                <p className="text-xs text-gray-400">Submit a civic grievance</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/my-complaints")}
              className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <FileText size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">View All Complaints</p>
                <p className="text-xs text-gray-400">See detailed history</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/track-status")}
              className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Clock size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Track Status</p>
                <p className="text-xs text-gray-400">Follow up on progress</p>
              </div>
            </button>
          </div>

        </main>
      </div>

      {/* ─── COMPLAINT MODAL OVERLAY ─── */}
      <AddComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
      />
    </>
  );
}

export default Dashboard;
