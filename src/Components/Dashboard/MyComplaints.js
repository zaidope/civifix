import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import AccountabilityChain from "../AccountabilityChain";

function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [mapModal, setMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState("");

  const uid = localStorage.getItem("uid");
  const username = localStorage.getItem("citizen_username");

  useEffect(() => {
    if (!uid) {
      navigate("/login");
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/history/${uid}`)
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [uid, navigate]);

  const getStatusBadge = (status) => {
    const colors = {
      Submitted: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
      "Under Progress": "bg-blue-100 text-blue-700 border-blue-200",
      Resolved: "bg-green-100 text-green-700 border-green-200",
      "Not Able To Resolve": "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
        {status}
      </span>
    );
  };

  const getProgressStep = (status) => {
    if (status === "Resolved") return 3;
    if (status === "Under Progress" || status === "In Progress") return 2;
    return 1;
  };

  if (!uid) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/citizen/dashboard")}
            className="text-gray-500 hover:text-indigo-600 transition p-2 rounded-lg hover:bg-indigo-50"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Complaints</h1>
            <p className="text-sm text-gray-500">{username && `Logged in as ${username}`} — {complaints.length} complaint{complaints.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {mapModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-800">📍 Complaint Location</h3>
              <button onClick={() => setMapModal(false)} className="text-gray-500 hover:text-red-500 text-2xl font-bold">×</button>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">📌 <strong>Address:</strong> {mapLocation}</p>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(mapLocation)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition"
              >
                🌍 Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewModal && selectedComplaint && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-indigo-600">📋 Complaint Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Category</p>
                  <p className="font-semibold">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Status</p>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Submitted</p>
                  <p className="font-semibold">{selectedComplaint.date ? new Date(selectedComplaint.date).toLocaleString('en-IN') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Assigned To</p>
                  <p className="font-semibold">{selectedComplaint.departmentOfficer || "Not yet assigned"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">📍 Location</p>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold flex-1">{selectedComplaint.location}</p>
                    <button
                      onClick={() => { setMapLocation(selectedComplaint.location); setMapModal(true); }}
                      className="flex-shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      🗺️ Map
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Description</p>
                  <p className="font-semibold bg-white border rounded-lg p-3">{selectedComplaint.description}</p>
                </div>
                {selectedComplaint.comments && (
                  <div className="col-span-2">
                    <p className="text-xs font-bold uppercase text-gray-400 mb-1">Officer Comments</p>
                    <p className="font-semibold bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-800">{selectedComplaint.comments}</p>
                  </div>
                )}
              </div>

              {/* Accountability Chain */}
              <div className="mb-4">
                <AccountabilityChain
                  complaintId={selectedComplaint._id}
                  lat={selectedComplaint.latitude}
                  lng={selectedComplaint.longitude}
                  issueType={selectedComplaint.category}
                  location={selectedComplaint.location}
                />
              </div>

              {/* Progress Tracker */}
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-gray-400 mb-3">Progress</p>
                <div className="flex items-center gap-0">
                  {["Submitted", "In Progress", "Resolved"].map((step, i) => {
                    const currentStep = getProgressStep(selectedComplaint.status);
                    const isActive = i + 1 <= currentStep;
                    return (
                      <React.Fragment key={step}>
                        <div className={`flex flex-col items-center ${i > 0 ? "flex-1" : ""}`}>
                          {i > 0 && (
                            <div className={`h-1 w-full mb-2 ${isActive ? "bg-indigo-500" : "bg-gray-200"} transition-all`} />
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"} transition-all`}>
                            {i + 1}
                          </div>
                          <p className={`text-xs mt-1 ${isActive ? "text-indigo-600 font-bold" : "text-gray-400"}`}>{step}</p>
                        </div>
                        {i < 2 && <div className={`flex-1 h-1 mt-[-16px] ${i + 1 < currentStep ? "bg-indigo-500" : "bg-gray-200"}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Active Helpers / Responders */}
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-gray-400 mb-2">👷 Active Responders</p>
                {selectedComplaint.status === "Resolved" ? (
                  <div className="flex items-center bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="w-10 h-10 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-xl mr-3">✓</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-green-700 uppercase">Final Resolver</p>
                      <p className="font-bold text-gray-800">{selectedComplaint.resolutionOfficerName || selectedComplaint.departmentOfficer || "Unknown Officer"}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">Issue has been completely resolved.</p>
                    </div>
                  </div>
                ) : selectedComplaint.departmentOfficer ? (
                  <div className="flex items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl mr-3">⚙️</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-700 uppercase">Assigned Officer / Field Responder</p>
                      <p className="font-bold text-gray-800">{selectedComplaint.departmentOfficer}</p>
                      <p className="text-xs text-indigo-600 font-medium mt-1">Currently working on this issue.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xl mr-3">⏳</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase">Pending Assignment</p>
                      <p className="font-bold text-gray-800">Waiting for Responder</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">A team will be assigned shortly.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Details */}
              {selectedComplaint.status === "Resolved" && selectedComplaint.resolutionOfficerName && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold uppercase text-green-700 mb-2">✅ Resolution Details</p>
                  <p className="text-sm font-medium"><strong>Officer:</strong> {selectedComplaint.resolutionOfficerName}</p>
                  {selectedComplaint.resolutionOfficerPhone && (
                    <p className="text-sm font-medium"><strong>Phone:</strong> {selectedComplaint.resolutionOfficerPhone}</p>
                  )}
                  {selectedComplaint.resolutionDate && (
                    <p className="text-sm font-medium"><strong>Resolved On:</strong> {new Date(selectedComplaint.resolutionDate).toLocaleDateString("en-IN")}</p>
                  )}
                </div>
              )}

              {/* Images */}
              {(() => {
                let imageArray = [];
                if (Array.isArray(selectedComplaint.images)) {
                  imageArray = selectedComplaint.images;
                } else if (selectedComplaint.images && typeof selectedComplaint.images === 'object') {
                  imageArray = Object.values(selectedComplaint.images).filter(img => img && img.trim() !== '');
                }
                return imageArray.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2">🖼️ Photos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {imageArray.map((image, idx) => (
                        <img
                          key={idx}
                          src={`${API_URL}/uploads/${image}`}
                          alt={`img-${idx}`}
                          className="w-full h-24 object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                          onError={(e) => { e.target.style.display = "none"; }}
                          onClick={() => window.open(`${API_URL}/uploads/${image}`, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="p-6 pt-0">
              <button onClick={() => setViewModal(false)} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-24">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Complaints Yet</h3>
            <p className="text-gray-500 mb-6">You haven't submitted any complaints yet. Click below to file one.</p>
            <button
              onClick={() => navigate("/citizen/dashboard")}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              File a Complaint
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {complaints.map((c) => (
              <div key={c._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {c.category}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                    <p className="text-gray-800 font-semibold mb-1 line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span>📍 {c.location}</span>
                      <span>🗓️ {c.date ? new Date(c.date).toLocaleDateString("en-IN") : "N/A"}</span>
                      {c.images && c.images.length > 0 && <span>📷 {c.images.length} image{c.images.length > 1 ? "s" : ""}</span>}
                    </div>

                    {/* Image Thumbnails */}
                    {c.images && c.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {(Array.isArray(c.images) ? c.images : Object.values(c.images).filter(Boolean)).slice(0, 3).map((image, idx) => (
                          <img
                            key={idx}
                            src={`${API_URL}/uploads/${image}`}
                            alt={`Complaint ${idx + 1}`}
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ))}
                        {(Array.isArray(c.images) ? c.images : []).length > 3 && (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-semibold">
                            +{c.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedComplaint(c); setViewModal(true); }}
                    className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition whitespace-nowrap self-start"
                  >
                    View Details
                  </button>
                </div>

                {/* Mini Progress Tracker */}
                <div className="mt-4 flex items-center gap-1">
                  {["Submitted", "In Progress", "Resolved"].map((step, i) => {
                    const currentStep = getProgressStep(c.status);
                    const isActive = i + 1 <= currentStep;
                    return (
                      <React.Fragment key={step}>
                        <div className={`h-1.5 flex-1 rounded-full ${isActive ? "bg-indigo-500" : "bg-gray-100"} transition-all`} />
                      </React.Fragment>
                    );
                  })}
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyComplaints;
