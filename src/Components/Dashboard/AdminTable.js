import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { API_URL } from "../../config";
import toast, { Toaster } from "react-hot-toast";

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function AdminTable(props) {
  const [complaints, setComplaints] = useState([]);
  const [viewModal, setViewModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [forwardModal, setForwardModal] = useState(false);
  const [officer, setOfficer] = useState("");
  const [imageModal, setImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [detailsImageModal, setDetailsImageModal] = useState(false);
  const [selectedDetailsImage, setSelectedDetailsImage] = useState("");
  const [mapModal, setMapModal] = useState(false);
  const [mapComplaint, setMapComplaint] = useState(null);

  // Fetch all complaints
  useEffect(() => {
    fetch(`${API_URL}/admin`)
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data.reverse());
        props.setNoOfComplaints(data.length);
        props.setComplaintsFwded(
          data.filter((c) => c.status === "Resolved").length
        );
      })
      .catch((err) => {
        // Handle fetch error silently
      });
  }, [deleteModal, forwardModal]);

  // Delete complaint
  async function deleteComplaint(id) {
    try {
      const res = await fetch(`${API_URL}/complaints/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("🗑️ Complaint deleted successfully");
        setDeleteModal(false);
      } else {
        toast.error("❌ Failed to delete complaint");
      }
    } catch (err) {
      toast.error("Server error. Try again later.");
    }
  }

  // Forward complaint to officer
  async function forwardComplaint() {
    if (!officer) {
      toast.error("Please select a department before forwarding.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/complaints/${selectedComplaint._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departmentOfficer: officer,
            status: "In Progress",
            comments: `Forwarded to ${officer}`,
          }),
        }
      );

      if (res.ok) {
        toast.success(
          (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">📤 Complaint Forwarded!</span>
              <span className="text-xs opacity-90">Assigned to {officer}</span>
            </div>
          ),
          {
            duration: 3000,
            style: {
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "#fff",
              borderRadius: "12px",
              padding: "14px 18px",
              boxShadow: "0 8px 30px rgba(79,70,229,0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#4f46e5" },
          }
        );
        setForwardModal(false);
        setOfficer("");
        setSelectedComplaint(null);
      } else {
        toast.error("❌ Failed to forward complaint.");
      }
    } catch (err) {
      alert("Server error while forwarding complaint.");
    }
  }

  // Status badge color
  const getStatusBadge = (status) => {
    const styles = {
      Submitted: "bg-yellow-100 text-yellow-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Resolved: "bg-green-100 text-green-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"
          }`}
      >
        {status}
      </span>
    );
  };

  // Priority badge for quick visual scan
  const getPriorityBadge = (priorityLevel, priorityScore) => {
    const level = priorityLevel || "LOW";
    const styles = {
      LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
      MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
      HIGH: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${styles[level] || styles.LOW
          }`}
      >
        <span>
          {level === "HIGH" ? "🔥" : level === "MEDIUM" ? "⚠️" : "✅"}
        </span>
        <span>{level}</span>
        {typeof priorityScore === "number" && (
          <span className="text-[10px] opacity-70">({priorityScore})</span>
        )}
      </div>
    );
  };

  // Compact severity indicator from 1–3 based on image bbox
  const getSeverityPill = (severity) => {
    if (!severity) return <span className="text-xs text-gray-400">N/A</span>;
    const colors = {
      1: "bg-emerald-100 text-emerald-700",
      2: "bg-amber-100 text-amber-700",
      3: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colors[severity] || "bg-gray-100 text-gray-700"
          }`}
        title={`Severity level ${severity} (1 = small, 3 = large)`}
      >
        {severity}
      </span>
    );
  };

  return (
    <div className="relative">
      <Toaster position="top-center" />
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
                    <p className="font-medium flex-1">{mapComplaint.location}</p>
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
                      attribution='&copy; Google Maps'
                      url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    />
                    <Marker position={[mapComplaint.latitude, mapComplaint.longitude]} icon={redIcon}>
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
                  // Fallback: no coordinates, just show a text and link
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

      {/* View Modal */}
      {viewModal && selectedComplaint && (
        <div className="z-10 bg-black bg-opacity-40 flex justify-center items-center fixed inset-0">
          <div className="bg-white w-[60vw] max-h-[85vh] overflow-y-auto rounded-xl p-8 shadow-2xl text-left border">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-indigo-600">📋 Complaint Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-5 rounded-xl text-gray-700 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Citizen</p>
                <p className="font-medium">{selectedComplaint.username} <span className="text-gray-400 text-xs">(UID: {selectedComplaint.uid})</span></p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">📞 Mobile Phone</p>
                <p className="font-medium text-indigo-700">{selectedComplaint.phone || <span className="text-gray-400">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Category</p>
                <p className="font-medium">{selectedComplaint.category}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Submitted On</p>
                <p className="font-medium">{selectedComplaint.date ? new Date(selectedComplaint.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">📍 Location</p>
                <div className="flex items-center gap-3">
                  <p className="font-medium flex-1">{selectedComplaint.location}</p>
                  <button
                    onClick={() => { setMapComplaint(selectedComplaint); setMapModal(true); }}
                    className="flex-shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    🗺️ View on Map
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Assigned Officer</p>
                <p className="font-medium">{selectedComplaint.departmentOfficer || <span className="text-gray-400">Not Assigned</span>}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Status</p>
                <p>{getStatusBadge(selectedComplaint.status)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Description</p>
                <p className="font-medium bg-white rounded-lg p-3 border">{selectedComplaint.description}</p>
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
                <strong className="text-sm text-gray-600">🖼️ Complaint Images:</strong>
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

            <div className="flex justify-end mt-6">
              <button onClick={() => setViewModal(false)} className="bg-indigo-600 px-8 py-2.5 rounded-lg text-white font-semibold hover:bg-indigo-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && selectedComplaint && (
        <div className="z-10 bg-black bg-opacity-40 flex justify-center items-center fixed inset-0">
          <div className="bg-white px-10 py-8 rounded-lg text-center shadow-lg border">
            <h2 className="text-sm mb-4 font-bold text-gray-600">
              Delete complaint by{" "}
              <span className="text-red-600">{selectedComplaint.username}</span>?
            </h2>
            <p className="text-gray-500 mb-4">
              This action cannot be undone. Confirm deletion?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => deleteComplaint(selectedComplaint._id)}
                className="bg-red-500 px-6 py-2 rounded-md text-white font-semibold"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteModal(false)}
                className="bg-gray-400 px-6 py-2 rounded-md text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardModal && selectedComplaint && (
        <div className="z-20 bg-black bg-opacity-50 flex justify-center items-center fixed inset-0 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <span className="text-2xl">📤</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Forward Complaint</h2>
                  <p className="text-indigo-200 text-xs mt-0.5">ID: {selectedComplaint._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Department / Officer</label>
              <select
                onChange={(e) => setOfficer(e.target.value)}
                value={officer}
                className="w-full border border-gray-300 rounded-xl p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-gray-50"
              >
                <option value="">-- Choose Department --</option>
                <option value="Gram Panchayat">🏘️ Gram Panchayat</option>
                <option value="Water Board">💧 Water Board</option>
                <option value="Public Works Dept">🏗️ Public Works Dept</option>
                <option value="Health Department">🏥 Health Department</option>
                <option value="Electricity Board">⚡ Electricity Board</option>
                <option value="Municipal Corporation">🏛️ Municipal Corporation</option>
                <option value="Traffic Police">🚦 Traffic Police</option>
                <option value="Fire Department">🚒 Fire Department</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={forwardComplaint}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  📤 Forward
                </button>
                <button
                  onClick={() => { setForwardModal(false); setOfficer(""); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
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

      {/* Complaint Table */}
      <div className="h-[88vh] w-full overflow-auto rounded-lg border border-gray-300 shadow-sm m-5">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold">#</th>
              <th className="px-6 py-3 font-semibold">Citizen</th>
              <th className="px-6 py-3 font-semibold">Complaint ID</th>
              <th className="px-6 py-3 font-semibold">Officer</th>
              <th className="px-6 py-3 font-semibold">Category</th>
              <th className="px-6 py-3 font-semibold">Severity</th>
              <th className="px-6 py-3 font-semibold">Priority</th>
              <th className="px-6 py-3 font-semibold">Images</th>
              <th className="px-6 py-3 font-semibold">Location</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {complaints.map((c, index) => (
              <tr key={c._id} className="hover:bg-gray-50 border-t">
                <td className="px-6 py-3">{index + 1}</td>
                <td className="px-6 py-3">
                  <div>
                    <div className="font-medium">{c.username}</div>
                    <div className="text-xs text-gray-400">UID: {c.uid}</div>
                  </div>
                </td>
                <td className="px-6 py-3 text-xs text-green-600 font-mono">
                  <div className="flex items-center gap-2">
                    <span>{c._id}</span>
                    {c.images && c.images.length > 0 && (
                      <span className="text-blue-500" title={`${c.images.length} image(s) attached`}>
                        📷
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-sm">
                  {c.departmentOfficer || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-3">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                    {c.category}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {getSeverityPill(c.severity_level)}
                </td>
                <td className="px-6 py-3">
                  {getPriorityBadge(c.priority_level, c.priority_score)}
                </td>
                <td className="px-6 py-3">
                  {/* Image thumbnails */}
                  {c.images && c.images.length > 0 ? (
                    <div className="flex gap-1">
                      {c.images.slice(0, 3).map((image, idx) => (
                        <img
                          key={idx}
                          src={`${API_URL}/uploads/${image}`}
                          alt={`Image ${idx + 1}`}
                          className="w-8 h-8 object-cover rounded border hover:scale-110 transition-transform cursor-pointer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          title={`Click to view image ${idx + 1}`}
                          onClick={() => {
                            setSelectedImage(`${API_URL}/uploads/${image}`);
                            setImageModal(true);
                          }}
                        />
                      ))}
                      {c.images.length > 3 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded flex items-center">
                          +{c.images.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No images</span>
                  )}
                </td>
                <td className="px-6 py-3">{c.location || "-"}</td>
                <td className="px-6 py-3">{getStatusBadge(c.status)}</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    {/* View Button */}
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setViewModal(true);
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      👁️ <span>Details</span>
                    </button>


                    {/* Forward Button */}
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setForwardModal(true);
                      }}
                      className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-3 py-1.5 rounded-md shadow-sm hover:shadow-green-400/40 hover:scale-105 transition-all duration-200"
                    >
                      🔁 <span className="font-medium">Forward</span>
                    </button>


                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setDeleteModal(true);
                      }}
                    >
                      🗑️delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {complaints.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No complaints found.
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminTable;
