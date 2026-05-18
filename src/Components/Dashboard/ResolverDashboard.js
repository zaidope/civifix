import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { handleLogout } from "../../utils/logout";
import { LayoutDashboard, Clock, CheckCircle, Forward, X, Database } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { API_URL } from "../../config";
import AuthorityDataUpload from "./AuthorityDataUpload";

function ResolverDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Add a trigger to manually refetch
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateModal, setUpdateModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);

  const [status, setStatus] = useState("");
  const [comments, setComments] = useState("");
  const [imageModal, setImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [detailsImageModal, setDetailsImageModal] = useState(false);
  const [selectedDetailsImage, setSelectedDetailsImage] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | assigned | resolved
  const [forwardModal, setForwardModal] = useState(false);
  const [forwardOfficer, setForwardOfficer] = useState("");
  const [resolutionOfficerName, setResolutionOfficerName] = useState("");
  const [resolutionOfficerPhone, setResolutionOfficerPhone] = useState("");

 const officerName = localStorage.getItem("officer_name") || "officer";
  const [mapModal, setMapModal] = useState(false);
  const [mapComplaint, setMapComplaint] = useState(null);

  // Auth guard + fetch complaints assigned to this officer
  useEffect(() => {
    const storedOfficer = localStorage.getItem("officer_name");
    if (!storedOfficer) {
      navigate("/login");
      return;
    }

    fetch(`${API_URL}/officer/${storedOfficer}`)
      .then((res) => res.json())
      .then((data) => setComplaints(data.reverse()))
      .catch(() => {
        // Handle fetch error silently
      });
  }, [navigate, refreshKey]);

  // Update complaint status & comments
  async function handleStatusUpdate(id) {
    if (!status) return toast.error("Please select a status before updating.");
    
    // Validate officer info for Under Progress and Resolved
    if (status === "Under Progress" || status === "Resolved") {
      if (!resolutionOfficerName.trim()) {
        return toast.error("Officer name is required.");
      }
      if (!resolutionOfficerPhone || resolutionOfficerPhone.length !== 10) {
        return toast.error("Officer phone must be exactly 10 digits.");
      }
    }

    try {
      const body = { status, comments };
      if (status === "Resolved" || status === "Under Progress") {
        body.resolutionOfficerName = resolutionOfficerName.trim();
        body.resolutionOfficerPhone = resolutionOfficerPhone;
      }
      if (status === "Resolved") {
        body.resolutionDate = new Date().toISOString();
      }
      const res = await fetch(`${API_URL}/complaints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("✅ Complaint updated successfully!");
        setUpdateModal(false);
        setStatus("");
        setComments("");
        setResolutionOfficerName("");
        setResolutionOfficerPhone("");
        setRefreshKey(prev => prev + 1); // Refetch data
      } else {
        toast.error("❌ Failed to update complaint.");
      }
    } catch (err) {
      toast.error("Failed to update status.");
    }
  }

  // Handle complaint forwarding / reassignment
  async function handleForward(id) {
    if (!forwardOfficer) {
      return toast.error("Please enter a new officer or department name.");
    }
    
    // We update the same endpoint to simulate reassignment
    try {
      const res = await fetch(`${API_URL}/complaints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           departmentOfficer: forwardOfficer,
           comments: `Forwarded to ${forwardOfficer} by ${officerName}`
        }),
      });
      if (res.ok) {
        toast.success(`Complaint forwarded to ${forwardOfficer}!`);
        setForwardModal(false);
        setForwardOfficer("");
        
        // Remove from local list as it's no longer theirs
        setComplaints(complaints.filter(c => c._id !== id));
      } else {
        toast.error("Failed to forward complaint.");
      }
    } catch (err) {
      toast.error("Server error while forwarding.");
    }
  }

  // Filter complaints based on active tab using useMemo to avoid repeated renders
  const filteredComplaints = React.useMemo(() => {
    switch(activeTab) {
       case 'assigned':
          return complaints.filter(c => c.status !== "Resolved");
       case 'resolved':
          return complaints.filter(c => c.status === "Resolved");
       default:
          return complaints;
    }
  }, [complaints, activeTab]);

  // Badge UI helper
  const getStatusBadge = (status) => {
    const colors = {
      Submitted: "bg-yellow-100 text-yellow-700",
      "In Progress": "bg-blue-100 text-blue-700",
      "Under Progress": "bg-blue-100 text-blue-700",
      Resolved: "bg-emerald-100 text-emerald-700",
      "Not Able To Resolve": "bg-red-100 text-red-700"
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          colors[status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Update Modal */}
      {updateModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl w-[450px] shadow-2xl text-center transform transition-all relative">
            <button 
              onClick={() => setUpdateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-indigo-600 mb-2">
              Update Status
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              ID: <span className="font-mono text-gray-800">{selectedComplaint._id}</span>
            </p>

            <div className="text-left mb-4">
              <label className="block text-sm font-semibold mb-1 text-gray-700">Set New Status</label>
              <select
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">-- Select Status --</option>
                <option value="Under Progress">Under Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Not Able To Resolve">Not Able To Resolve</option>
              </select>
            </div>

            {(status === "Resolved" || status === "Under Progress") && (
              <div className={`p-3 rounded-lg border mt-2 mb-3 text-left ${
                status === "Resolved" ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100"
              }`}>
                <p className={`text-xs font-semibold mb-2 ${
                  status === "Resolved" ? "text-green-700" : "text-blue-700"
                }`}>
                  {status === "Resolved" ? "✅ Resolution Details (required):" : "🔄 Officer Details (required):"}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Officer Full Name *"
                    className="w-full py-2 px-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                    value={resolutionOfficerName}
                    onChange={(e) => setResolutionOfficerName(e.target.value)}
                  />
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Officer Phone (10 digits) *"
                      maxLength="10"
                      pattern="[0-9]{10}"
                      className={`w-full py-2 px-3 border rounded text-sm focus:ring-2 outline-none transition-all ${
                        resolutionOfficerPhone && resolutionOfficerPhone.length !== 10
                          ? "border-red-400 focus:ring-red-400"
                          : "border-gray-300 focus:ring-indigo-400"
                      }`}
                      value={resolutionOfficerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setResolutionOfficerPhone(val);
                      }}
                    />
                    {resolutionOfficerPhone && resolutionOfficerPhone.length !== 10 && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ Phone must be exactly 10 digits ({resolutionOfficerPhone.length}/10)
                      </p>
                    )}
                    {resolutionOfficerPhone && resolutionOfficerPhone.length === 10 && (
                      <p className="text-xs text-green-600 mt-1">✓ Valid phone number</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-left mb-4">
              <label className="block text-sm font-semibold mb-1 text-gray-700">Additional Comments</label>
              <textarea
                placeholder="Add notes for the citizen..."
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                rows="3"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setUpdateModal(false)}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedComplaint._id)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl w-[450px] shadow-2xl transform transition-all relative">
            <button 
              onClick={() => setForwardModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                <Forward className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Forward Complaint
              </h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">
              Reassign <span className="font-mono font-medium text-gray-700">{selectedComplaint._id}</span> to another department or officer.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1 text-gray-700">New Officer / Department Name</label>
              <input
                type="text"
                placeholder="e.g., Jane Doe or Water Supply Dept"
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={forwardOfficer}
                onChange={(e) => setForwardOfficer(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setForwardModal(false)}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleForward(selectedComplaint._id)}
                className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 font-medium shadow-sm transition-colors"
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-2xl w-[700px] overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-800">📍 Complaint Location</h3>
                <button onClick={() => setMapModal(false)} className="text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>
              </div>
              <div className="bg-gray-50">
                {mapComplaint && (
                  <div className="px-4 py-2 flex flex-col gap-2 border-b text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-lg">📌</span>
                      <p className="text-sm text-gray-700 font-medium flex-1">{mapComplaint.location}</p>
                    </div>
                    {typeof mapComplaint.latitude === "number" && typeof mapComplaint.longitude === "number" && (
                      <p className="text-xs text-gray-500 font-mono">
                        Lat: {mapComplaint.latitude.toFixed(5)}, Lng: {mapComplaint.longitude.toFixed(5)}
                      </p>
                    )}
                  </div>
                )}

                <div className="w-full h-80">
                  {mapComplaint && typeof mapComplaint.latitude === "number" && typeof mapComplaint.longitude === "number" ? (
                    <MapContainer
                      center={[mapComplaint.latitude, mapComplaint.longitude]}
                      zoom={16}
                      scrollWheelZoom
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[mapComplaint.latitude, mapComplaint.longitude]}>
                        <Popup>
                          <div className="text-xs">
                            <div className="font-semibold mb-1">Complaint Location</div>
                            <div>{mapComplaint.location}</div>
                            <div className="mt-1 font-mono">
                              {mapComplaint.latitude.toFixed(5)}, {mapComplaint.longitude.toFixed(5)}
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${mapComplaint.latitude},${mapComplaint.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline mt-1 inline-block"
                            >
                              Open in Google Maps
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-gray-600">
                      <p>No GPS coordinates stored for this complaint.</p>
                      {mapComplaint && mapComplaint.location && (
                        <a
                          href={`https://www.google.com/maps/search/${encodeURIComponent(mapComplaint.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                        >
                          🌍 Open "{mapComplaint.location}" in Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      )}

      {/* View Complaint Modal */}
      {viewModal && selectedComplaint && (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-8 rounded-xl w-[650px] max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-indigo-600">📋 Complaint Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-5 rounded-xl text-gray-700 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Citizen</p>
                <p className="font-medium">{selectedComplaint.username}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">📞 Phone</p>
                <p className="font-medium text-indigo-700">{selectedComplaint.phone || <span className="text-gray-400">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Category</p>
                <p className="font-medium">{selectedComplaint.category}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">🗓️ Submitted</p>
                <p className="font-medium text-xs">{selectedComplaint.date ? new Date(selectedComplaint.date).toLocaleString('en-IN') : 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">📍 Location</p>
                <div className="flex items-center gap-3">
                  <p className="font-medium flex-1">{selectedComplaint.location}</p>
                  <button
                    onClick={() => { setMapComplaint(selectedComplaint); setMapModal(true); }}
                    className="flex-shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    🗺️ View on Map
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Description</p>
                <p className="font-medium bg-white rounded-lg p-3 border">{selectedComplaint.description}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Status</p>
                <p>{getStatusBadge(selectedComplaint.status)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Comments</p>
                <p className="font-medium text-xs">{selectedComplaint.comments || 'No comments yet'}</p>
              </div>
              {selectedComplaint.status === "Resolved" && selectedComplaint.resolutionOfficerName && (
                <div className="col-span-2 bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-xs font-bold uppercase text-green-700 mb-2">✅ Resolution Details</p>
                  <p className="text-sm"><strong>Officer:</strong> {selectedComplaint.resolutionOfficerName}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedComplaint.resolutionOfficerPhone}</p>
                  {selectedComplaint.resolutionDate && <p className="text-sm"><strong>Resolved On:</strong> {new Date(selectedComplaint.resolutionDate).toLocaleDateString('en-IN')}</p>}
                </div>
              )}
            </div>

            {/* Images */}
            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
              <div className="mt-4">
                <strong className="text-sm text-gray-600">🖼️ Images:</strong>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {selectedComplaint.images.map((image, index) => (
                    <img
                      key={index}
                      src={`${API_URL}/uploads/${image}`}
                      alt={`Complaint image ${index + 1}`}
                      className="w-full h-28 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => { setSelectedDetailsImage(`${API_URL}/uploads/${image}`); setDetailsImageModal(true); }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="text-center mt-6">
              <button onClick={() => setViewModal(false)} className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {feedbackModal && selectedComplaint && (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg w-[600px] shadow-xl">
            <h2 className="text-lg font-semibold text-green-600 mb-4 text-center">
              Citizen Feedback
            </h2>
            <p className="text-gray-700 mb-2">
              <strong>Complaint ID:</strong>{" "}
              <span className="font-mono text-gray-800">{selectedComplaint._id}</span>
            </p>
            <p className="text-gray-600 italic mb-4">
              “{selectedComplaint.citizenFeedback || "No feedback yet"}”
            </p>
            <p>
              <strong>Rating:</strong>{" "}
              {selectedComplaint.resolutionRating || "Not rated"}
            </p>
            <div className="text-center mt-5">
              <button
                onClick={() => setFeedbackModal(false)}
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div className="z-30 bg-black bg-opacity-75 flex justify-center items-center fixed inset-0">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Image Preview</h3>
              <button
                onClick={() => setImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Full size preview"
              className="max-w-full max-h-[70vh] object-contain rounded border"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
        </div>
      )}

      {/* Details Image Modal */}
      {detailsImageModal && (
        <div className="z-30 bg-black bg-opacity-75 flex justify-center items-center fixed inset-0">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Complaint Image</h3>
              <button
                onClick={() => setDetailsImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <img
              src={selectedDetailsImage}
              alt="Complaint image"
              className="max-w-full max-h-[70vh] object-contain rounded border"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
        </div>
      )}

      {/* Dashboard Section */}
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-indigo-700 font-extrabold text-xl tracking-tight flex items-center gap-2">
               <span className="bg-indigo-100 p-1.5 rounded-lg">🛡️</span> Officer Portal
            </h2>
            <div className="mt-3 bg-indigo-50 rounded-xl p-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                {officerName.charAt(0).toUpperCase()}
              </div>
              <p className="text-center font-bold text-gray-800 text-sm">{officerName}</p>
              <p className="text-center text-xs text-indigo-600 font-semibold">Department Officer</p>
              <p className="text-center text-xs text-gray-400 mt-1">{complaints.length} complaints assigned</p>
            </div>
          </div>
          
          <div className="flex-1 py-4 flex flex-col gap-1 px-3">
            <button 
               onClick={() => setActiveTab('dashboard')}
               className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
               <LayoutDashboard className="w-5 h-5" />
               Overview
            </button>
            <button 
               onClick={() => setActiveTab('assigned')}
               className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'assigned' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
               <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 opacity-70" />
                  Live Inbox
               </div>
               {complaints.filter(c => c.status !== "Resolved").length > 0 && (
                  <span className="bg-amber-100 text-amber-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
                     {complaints.filter(c => c.status !== "Resolved").length}
                  </span>
               )}
            </button>
            <button 
               onClick={() => setActiveTab('resolved')}
               className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'resolved' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
               <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 opacity-70" />
                  Resolved
               </div>
               <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
                  {complaints.filter(c => c.status === "Resolved").length}
               </span>
            </button>
            <button 
               onClick={() => setActiveTab('authority')}
               className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold mt-auto border-t border-gray-100 ${activeTab === 'authority' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
               <Database className="w-5 h-5 opacity-70" />
               Authority Upload
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-10 overflow-auto">
          {/* Dashboard Overview Tab */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="text-2xl font-bold text-gray-800 mb-6">Overview</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-gray-500">Total Assigned</p>
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                           <LayoutDashboard className="w-5 h-5" />
                        </div>
                     </div>
                     <h3 className="text-4xl font-extrabold text-gray-800 tracking-tight">{complaints.length}</h3>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-gray-500">Active / Pending</p>
                        <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                           <Clock className="w-5 h-5" />
                        </div>
                     </div>
                     <h3 className="text-4xl font-extrabold text-gray-800 tracking-tight">{complaints.filter((c) => c.status !== "Resolved").length}</h3>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-gray-500">Resolved</p>
                        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                           <CheckCircle className="w-5 h-5" />
                        </div>
                     </div>
                     <h3 className="text-4xl font-extrabold text-gray-800 tracking-tight">{complaints.filter((c) => c.status === "Resolved").length}</h3>
                  </div>
               </div>

               <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center min-h-[200px]">
                  <p className="text-gray-500 font-medium">Select a tab from the sidebar to view detailed lists.</p>
               </div>
            </div>
          )}

          {/* Authority Data Upload Tab */}
          {activeTab === 'authority' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AuthorityDataUpload />
             </div>
          )}

          {/* Complaints Table (Shared for Assigned & Resolved Tabs) */}
          {(activeTab === 'assigned' || activeTab === 'resolved') && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
               <div className="flex justify-between items-end mb-6">
                  <div>
                     <h3 className="text-2xl font-bold text-gray-800">
                        {activeTab === 'assigned' ? 'Live Inbox' : 'Resolved Complaints'}
                     </h3>
                     <p className="text-gray-500 text-sm mt-1">
                        {activeTab === 'assigned' 
                           ? `You have ${filteredComplaints.length} complaints requiring your attention.` 
                           : `You have successfully resolved ${filteredComplaints.length} complaints.`}
                     </p>
                  </div>
               </div>
               
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-gray-700 border-collapse min-w-[800px]">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                        <tr>
                           <th className="px-6 py-4 whitespace-nowrap">ID / Info</th>
                           <th className="px-6 py-4">Citizen</th>
                           <th className="px-6 py-4">Location</th>
                           <th className="px-6 py-4 text-center">Images</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filteredComplaints.map((c, i) => (
                           <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                              <div className="font-mono text-xs text-indigo-600 font-bold mb-1">{c._id.slice(-6).toUpperCase()}</div>
                              <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                                 {c.category}
                              </span>
                              </td>
                              <td className="px-6 py-4">
                              <div>
                                 <div className="font-semibold text-gray-900">{c.username}</div>
                                 {c.phone ? (
                                    <div className="text-xs text-gray-500 mt-0.5">{c.phone}</div>
                                 ) : (
                                    <div className="text-xs text-gray-400 mt-0.5">UID: {c.uid}</div>
                                 )}
                              </div>
                              </td>
                              <td className="px-6 py-4 max-w-[200px]">
                                 <div className="truncate" title={c.location}>{c.location}</div>
                              </td>
                              <td className="px-6 py-4">
                              {/* Image thumbnails */}
                              {c.images && c.images.length > 0 ? (
                                 <div className="flex justify-center gap-1.5">
                                    {c.images.slice(0, 2).map((image, idx) => (
                                    <img
                                       key={idx}
                                       src={`${API_URL}/uploads/${image}`}
                                       alt={`Image ${idx + 1}`}
                                       className="w-9 h-9 object-cover rounded shadow-sm border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                                       onError={(e) => { e.target.style.display = 'none'; }}
                                       title={`Click to view`}
                                       onClick={() => {
                                          setSelectedImage(`${API_URL}/uploads/${image}`);
                                          setImageModal(true);
                                       }}
                                    />
                                    ))}
                                    {c.images.length > 2 && (
                                    <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                                       +{c.images.length - 2}
                                    </div>
                                    )}
                                 </div>
                              ) : (
                                 <div className="text-center text-gray-400 text-xs italic">N/A</div>
                              )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>
                              <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 isolate">
                                  {/* Always: View Details */}
                                  <button
                                     onClick={() => {
                                        setSelectedComplaint(c);
                                        setViewModal(true);
                                     }}
                                     title="View full complaint details"
                                     className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-sm text-xs font-semibold transition-colors"
                                  >
                                     👁️ Details
                                  </button>

                                  {/* Forward Button (Only if not resolved) */}
                                  {c.status !== "Resolved" && (
                                     <button
                                     onClick={() => {
                                        setSelectedComplaint(c);
                                        setForwardModal(true);
                                     }}
                                     title="Forward Complaint"
                                     className="p-2 text-orange-600 hover:bg-orange-50 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                                     >
                                     <Forward className="w-4 h-4" />
                                     </button>
                                  )}
                                  {/* View Feedback */}
                                  {c.status === "Resolved" && (
                                     <button
                                     onClick={() => {
                                        setSelectedComplaint(c);
                                        setFeedbackModal(true);
                                     }}
                                     className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm text-xs font-semibold transition-colors"
                                     >
                                     Feedback
                                     </button>
                                  )}
                                  {/* Update Status (only for non-resolved) */}
                                  {c.status !== "Resolved" && (
                                     <button
                                        onClick={() => {
                                           setSelectedComplaint(c);
                                           setUpdateModal(true);
                                        }}
                                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-xs font-bold transition-colors"
                                     >
                                        Update ➜
                                     </button>
                                  )}
                               </div>                            
                              </td>
                           </tr>
                        ))}
                        </tbody>
                     </table>

                     {filteredComplaints.length === 0 && (
                        <div className="text-center py-16 px-4">
                           <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                              <CheckCircle className="w-8 h-8 text-gray-400" />
                           </div>
                           <h4 className="text-lg font-bold text-gray-800 mb-1">Queue Empty</h4>
                           <p className="text-gray-500 max-w-sm mx-auto">
                              {activeTab === 'assigned' ? "You're all caught up! No active complaints in your inbox." : "No resolved complaints found in your history yet."}
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ResolverDashboard;
