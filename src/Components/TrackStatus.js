import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config";
import { Search, MapPin, Calendar, User, Phone, CheckCircle2, Clock } from "lucide-react";
import AccountabilityChain from "./AccountabilityChain";

function TrackStatus() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
    fetch(`${API_URL}/public-complaints`)
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data.reverse());
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching complaints:", err);
        setLoading(false);
      });
  }, []);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "active") return matchesSearch && c.status !== "Resolved";
    if (filter === "resolved") return matchesSearch && c.status === "Resolved";
    return matchesSearch;
  });

  const activeCount = complaints.filter(c => c.status !== "Resolved").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-100 blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 left-0 -ml-40 w-80 h-80 rounded-full bg-emerald-100 blur-3xl opacity-50 pointer-events-none"></div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Public Tracking
            </h1>
            <p className="text-gray-500">Monitor issue resolutions in real-time across the city.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active</span>
              <span className="text-2xl font-bold text-amber-500">{activeCount}</span>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Resolved</span>
              <span className="text-2xl font-bold text-emerald-500">{resolvedCount}</span>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center"
        >
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Location, or Category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setFilter("all")}
              className={`flex-1 md:px-6 py-2 text-sm font-semibold rounded-lg transition-all ${filter === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("active")}
              className={`flex-1 md:px-6 py-2 text-sm font-semibold rounded-lg transition-all ${filter === 'active' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter("resolved")}
              className={`flex-1 md:px-6 py-2 text-sm font-semibold rounded-lg transition-all ${filter === 'resolved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Resolved
            </button>
          </div>
        </motion.div>

        {/* List Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No complaints matched your criteria</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredComplaints.map((complaint, i) => {
                const isResolved = complaint.status === "Resolved";
                
                return (
                <motion.div 
                  key={complaint._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className={`bg-white rounded-2xl p-6 border transition-shadow hover:shadow-lg relative overflow-hidden ${
                    isResolved ? 'border-emerald-100 shadow-sm shadow-emerald-50' : 'border-gray-100 shadow-sm'
                  }`}
                >
                  
                  {isResolved && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-100 to-transparent opacity-50 rounded-bl-3xl"></div>
                  )}

                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full mb-2">
                        {complaint.category}
                      </span>
                      <p className="text-xs font-mono text-gray-400">ID: {complaint._id}</p>
                    </div>
                    
                    {isResolved ? (
                      <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Resolved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        <Clock className="w-4 h-4" /> {complaint.status}
                      </span>
                    )}
                  </div>

                  {/* Progress Tracker Widget */}
                  <div className="mb-6 px-2">
                     <div className="relative flex items-center justify-between w-full">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                        <div 
                           className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-1000"
                           style={{ 
                              width: complaint.status === 'Submitted' ? '0%' : 
                                     complaint.status === 'Under Progress' ? '50%' : 
                                     complaint.status === 'Resolved' ? '100%' : '50%' 
                           }}
                        ></div>

                        {/* Step 1: Submitted */}
                        <div className="relative z-10 flex flex-col items-center">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors border-2 ${true ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-300'}`}>
                              1
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${true ? 'text-indigo-700' : 'text-gray-400'}`}>Submitted</span>
                        </div>

                        {/* Step 2: Under Progress */}
                        <div className="relative z-10 flex flex-col items-center">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors border-2 ${complaint.status === 'Under Progress' || complaint.status === 'Resolved' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-300'}`}>
                              2
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${complaint.status === 'Under Progress' || complaint.status === 'Resolved' ? 'text-indigo-700' : 'text-gray-400'}`}>In Progress</span>
                        </div>

                        {/* Step 3: Resolved */}
                        <div className="relative z-10 flex flex-col items-center">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors border-2 ${complaint.status === 'Resolved' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-400 border-gray-300'}`}>
                              3
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${complaint.status === 'Resolved' ? 'text-emerald-700' : 'text-gray-400'}`}>Resolved</span>
                        </div>
                     </div>
                  </div>

                  {/* Body Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{complaint.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 shrink-0 mt-0.5 flex justify-center text-gray-400 text-sm">📝</div>
                      <p className="text-sm text-gray-600 line-clamp-2">{complaint.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                       <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                       Reported: {formatDate(complaint.date)}
                    </div>
                  </div>

                  {/* Active Helpers / Responders */}
                  <div className="mb-6">
                    {isResolved ? (
                      <div className="flex items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm mr-3">✓</div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Final Resolver</p>
                          <p className="text-sm font-bold text-gray-800">{complaint.resolutionOfficerName || complaint.departmentOfficer || "Unknown Officer"}</p>
                        </div>
                      </div>
                    ) : complaint.departmentOfficer ? (
                      <div className="flex items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3">⚙️</div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-indigo-700 uppercase">Assigned Officer / Field Responder</p>
                          <p className="text-sm font-bold text-gray-800">{complaint.departmentOfficer}</p>
                          <p className="text-[10px] text-indigo-600 font-medium">Currently working on this issue.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm mr-3">⏳</div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Pending Assignment</p>
                          <p className="text-sm font-bold text-gray-800">Waiting for Responder</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accountability Chain */}
                  <div className="mb-6">
                    <AccountabilityChain
                      complaintId={complaint._id}
                      lat={complaint.latitude}
                      lng={complaint.longitude}
                      issueType={complaint.category}
                      location={complaint.location}
                    />
                  </div>

                  {/* Resolution Box */}
                  {isResolved ? (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        Resolution Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="flex items-center gap-2 text-sm text-gray-800">
                            <User className="w-4 h-4 text-emerald-500" />
                            {complaint.resolutionOfficerName || "Unknown Officer"}
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-800">
                            <Phone className="w-4 h-4 text-emerald-500" />
                            {complaint.resolutionOfficerPhone || "No contact info"}
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-800 col-span-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            Resolved on {formatDate(complaint.resolutionDate)}
                         </div>
                      </div>
                      
                      {complaint.comments && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/50">
                          <p className="text-sm text-gray-600 italic">"{complaint.comments}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center text-sm text-gray-500 italic">
                        The department is currently working on this issue. Resolution details will appear here once completely resolved.
                     </div>
                  )}

                </motion.div>
              )})}
            </AnimatePresence>
          </div>
        )}

        <div className="text-center mt-12">
           <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
              &larr; Return to Home
           </Link>
        </div>

      </div>
    </div>
  );
}

export default TrackStatus;
