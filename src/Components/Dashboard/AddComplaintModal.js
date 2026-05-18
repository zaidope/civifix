import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { API_URL } from "../../config";
import AuthorityResolverWidget from "../AuthorityResolverWidget";
import imageCompression from 'browser-image-compression';



function AddComplaintModal({ isOpen, onClose, onSuccess }) {
  const [data, setData] = useState({
    username: localStorage.getItem("citizen_username") || "",
    uid: localStorage.getItem("uid") || "",
    phone: "",
    category: "",
    location: "",
    description: "",
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Location State (GPS-based + manual map selection)
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // AI Prediction State
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Detect location using browser GPS + Nominatim reverse geocoding
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const d = await res.json();
          if (d && d.display_name) {
            const parts = d.display_name.split(",");
            const shortAddress = parts.slice(0, 4).join(", ");
            setData((prev) => ({ ...prev, location: shortAddress }));
            setLocationDetected(true);
            toast.success("📍 Location detected!", { duration: 2000 });
          }
        } catch (err) {
          toast.error("Could not fetch address. Please type it manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        toast.error("Location access denied. Please type your address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addData = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle manual selection on map
  const handleMapLocationSelect = async (lat, lng) => {
    setLocationCoords({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const d = await res.json();
      if (d && d.display_name) {
        const parts = d.display_name.split(",");
        const shortAddress = parts.slice(0, 4).join(", ");
        setData((prev) => ({ ...prev, location: shortAddress }));
        // Manual selection, so treat as user-picked rather than GPS
        setLocationDetected(false);
      } else {
        setData((prev) => ({
          ...prev,
          location: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
        }));
        setLocationDetected(false);
      }
    } catch {
      setData((prev) => ({
        ...prev,
        location: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
      }));
      setLocationDetected(false);
    }
  };

  const LocationClickLayer = ({ onSelect }) => {
    useMapEvents({
      click(e) {
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const RecenterOnLocation = ({ location }) => {
    const map = useMap();
    useEffect(() => {
      if (location && typeof location.lat === "number" && typeof location.lng === "number") {
        map.setView([location.lat, location.lng], map.getZoom(), { animate: false });
      }
    }, [location, map]);
    return null;
  };

  // Handle image file selection with AI Prediction & Client-Side Compression
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    // Limit to 3 images maximum
    if (images.length + files.length > 3) {
      alert("❌ Maximum 3 images allowed.");
      return;
    }

    setUploading(true);

    try {
      const options = {
        maxSizeMB: 0.3, // Maximum 300KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp"
      };

      const compressedFiles = [];
      const newPreviews = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert(`❌ ${file.name} is not a valid image file.`);
          continue;
        }

        // Compress
        const compressedFile = await imageCompression(file, options);
        // Rename to .webp
        const finalFile = new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".webp"), {
          type: "image/webp",
        });

        compressedFiles.push(finalFile);
        
        // Preview
        const previewUrl = await imageCompression.getDataUrlFromFile(finalFile);
        newPreviews.push({ file: finalFile, preview: previewUrl });
      }

      setImages(prev => [...prev, ...compressedFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);

      // Trigger prediction on the first image if not already predicted
      if (!prediction && compressedFiles.length > 0 && images.length === 0) {
        predictCategory(compressedFiles[0], newPreviews[0].preview);
      }
    } catch (error) {
      console.error("Compression error:", error);
      alert("Error compressing images.");
    } finally {
      setUploading(false);
    }
  };

  const predictCategory = async (file, previewUrl) => {
    setIsPredicting(true);
    setPrediction({ status: 'scanning', preview: previewUrl });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // We still map localhost:9000 for AI dynamically if we run AI service on the same host
      const res = await fetch(`http://${window.location.hostname}:9000/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Prediction failed");

      const result = await res.json();

      // Apply prediction result with delay for animation
      setTimeout(() => {
        setPrediction({
          status: 'complete',
          label: result.label,
          confidence: result.confidence,
          preview: previewUrl
        });

        // Auto-select category — lower threshold to 0.4 to capture moderate-confidence detections
        const label = result.label.toLowerCase();
        let matchedCategory = "";

        if (label.includes("road") || label.includes("pothole") || label.includes("street") || label.includes("crack") || label.includes("asphalt")) {
          matchedCategory = "Roads & Streetlights";
        } else if (label.includes("water") || label.includes("pipe") || label.includes("flood") || label.includes("drain")) {
          matchedCategory = "Water Supply";
        } else if (label.includes("garbage") || label.includes("trash") || label.includes("waste") || label.includes("litter") || label.includes("rubbish")) {
          matchedCategory = "Garbage / Sanitation";
        } else if (label.includes("electricity") || label.includes("pole") || label.includes("wire") || label.includes("light") || label.includes("electric")) {
          matchedCategory = "Electricity";
        } else if (label.includes("health") || label.includes("stray") || label.includes("animal") || label.includes("fire") || label.includes("smoke")) {
          matchedCategory = "Health / Safety";
        } else if (result.confidence > 0.4) {
          matchedCategory = "Others";
        }

        // Always update the category if we matched one (regardless of confidence threshold)
        if (matchedCategory) {
          setData(prev => ({ ...prev, category: matchedCategory }));
        }

        setIsPredicting(false);
      }, 1500);

    } catch (error) {
      console.error("Prediction error:", error);
      setPrediction(null);
      setIsPredicting(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (images.length <= 1) setPrediction(null); // Clear prediction if all images removed
  };

  async function sendData(e) {
    e.preventDefault();
    setUploading(true);

    if (!data.username || !data.uid || !data.phone || !data.category || !data.location || !data.description) {
      alert("❌ Please fill in all required fields including your Mobile Phone Number!");
      setUploading(false);
      return;
    }

    // Validate phone number format (basic check)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.phone)) {
      alert("❌ Please enter a valid 10-digit mobile phone number!");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('uid', data.uid);
      formData.append('phone', data.phone);
      formData.append('category', data.category);
      formData.append('location', data.location);
      formData.append('description', data.description);
      formData.append('departmentOfficer', 'officer');
      formData.append('status', 'Submitted');

      // Attach precise GPS coordinates when available so that
      // backend can compute duplicate counts and main-road priority.
      if (locationCoords && typeof locationCoords.lat === "number" && typeof locationCoords.lng === "number") {
        formData.append('latitude', locationCoords.lat);
        formData.append('longitude', locationCoords.lng);
      }

      images.forEach((image) => {
        formData.append(`images`, image);
      });

      const res = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Complaint Successfully Registered", {
          duration: 4000,
          position: "top-center",
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '8px'
          },
        });
        setData({
          username: localStorage.getItem("citizen_username") || "",
          uid: localStorage.getItem("uid") || "",
          phone: "",
          category: "",
          location: "",
          description: "",
        });
        setImages([]);
        setImagePreviews([]);
        setPrediction(null);
        setLocationCoords(null);
        setLocationDetected(false);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        if (onSuccess) onSuccess();
      } else {
        const errorData = await res.json();
        alert(`❌ Failed to submit complaint: ${errorData.msg || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("❌ Server error. Try again later.");
    } finally {
      setUploading(false);
    }
  }

  // If used as a controlled modal and not open, don't render
  if (typeof isOpen === 'boolean' && !isOpen) return null;

  // Wrapper for modal mode
  const isModalMode = typeof onClose === 'function';

  const formContent = (
    <div className={isModalMode ? "relative w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-indigo-50 max-h-[92vh] overflow-y-auto" : "relative w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-indigo-50"}>
      {/* Close button when in modal mode */}
      {isModalMode && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-gray-100 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT COLUMN: FORM */}
          <div className="p-10">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 mb-8 flex items-center gap-3">
              <span className="text-3xl">📝</span> Submit Grievance
            </h2>

            <form onSubmit={sendData} className="space-y-5 text-gray-700">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-1.5 ml-1">Username</label>
                  <input
                    name="username"
                    type="text"
                    value={data.username}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-500 mb-1.5 ml-1">Mobile Phone <span className="text-red-500">*</span></label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="10-digit number"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    value={data.phone}
                    onChange={(e) => {
                      // Only allow digits
                      const val = e.target.value.replace(/\D/g, '');
                      addData({ target: { name: 'phone', value: val } });
                    }}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm hover:border-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Category</label>
                <div className="relative">
                  <select
                    name="category"
                    value={data.category}
                    onChange={addData}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none shadow-sm hover:border-indigo-300 text-sm font-medium text-gray-700"
                  >
                    <option value="">Select category</option>
                    <option>Roads & Streetlights</option>
                    <option>Water Supply</option>
                    <option>Garbage / Sanitation</option>
                    <option>Electricity</option>
                    <option>Health / Safety</option>
                    <option>Others</option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-sm font-bold text-gray-700 mb-0.5 ml-1">
                  Location <span className="text-xs font-normal text-gray-500 ml-1">(Type address or detect via GPS)</span>
                </label>

                {/* Location Input + Detect Button */}
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <textarea
                      name="location"
                      placeholder="e.g., Ward 12, JP Nagar, Bengaluru"
                      value={data.location}
                      onChange={(e) => {
                        addData(e);
                        setLocationDetected(false);
                      }}
                      required
                      rows="3"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm resize-none shadow-sm hover:border-indigo-300 group-hover:shadow-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap"
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        📍 Detect GPS
                      </>
                    )}
                  </button>
                </div>

                {/* Location source helper */}
                {locationDetected && (
                  <p className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                    <span>✓</span>
                    <span>Location detected from your current GPS position.</span>
                  </p>
                )}

                {/* OpenStreetMap Preview Link */}
                {data.location && (
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                      data.location
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-1"
                  >
                    🌍 View in OpenStreetMap ↗
                  </a>
                )}
              </div>

              {/* Interactive Map for manual selection */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">
                    You can also choose a precise spot on the map.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMapModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Expand map
                  </button>
                </div>
                <div
                  className={`h-44 rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow ${mapModalOpen ? 'hidden' : ''}`}
                  onClick={() => setMapModalOpen(true)}
                >
                  <MapContainer
                    center={
                      locationCoords
                        ? [locationCoords.lat, locationCoords.lng]
                        : [12.9716, 77.5946]
                    }
                    zoom={13}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%", zIndex: 10 }}
                  >
                    <TileLayer
                      attribution='&copy; Google Maps'
                      url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    />
                    <RecenterOnLocation location={locationCoords} />
                    {locationCoords && (
                      <CircleMarker
                        center={[locationCoords.lat, locationCoords.lng]}
                        radius={8}
                        pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Authority Resolver Preview */}
              {data.location && data.category && (
                <div className="mb-4 mt-2">
                  <AuthorityResolverWidget
                    location={data.location}
                    issueType={data.category}
                    lat={locationCoords?.lat}
                    lng={locationCoords?.lng}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Describe the issue in detail..."
                  value={data.description}
                  onChange={addData}
                  required
                  rows="4"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm resize-none shadow-sm hover:border-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Photos (Max 3)</label>
                <div className="relative border-2 border-dashed border-indigo-200 rounded-xl p-6 bg-indigo-50/30 hover:bg-indigo-50/80 hover:border-indigo-400 transition-all text-center cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-sm font-medium">Click to upload images</span>
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2 bg-gray-50 p-2 rounded-lg">
                  {imagePreviews.map((item, index) => (
                    <div key={index} className="relative w-16 h-16 rounded overflow-hidden border border-gray-200">
                      <img src={item.preview} alt="thumb" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className={`w-full py-4 mt-2 rounded-xl text-[15px] font-bold text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] transform transition-transform active:scale-95 flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)] ${uploading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
                  }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>🚀 Submit Complaint</>
                )}
              </button>

            </form>
          </div>

          {/* RIGHT COLUMN: AI ANALYSIS & PREDICTION VISUALIZATION */}
          <div className="bg-slate-50/80 border-l border-slate-100 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md">

            <div className="absolute inset-0 opacity-[0.15] pointer-events-none">
              <div className="absolute top-0 -left-10 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
              <div className="absolute top-0 -right-10 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-64 h-64 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {!prediction && !isPredicting ? (
              <div className="z-10 text-slate-400 flex flex-col items-center">
                <div className="mb-6 bg-white p-6 rounded-full inline-flex shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                  <svg className="w-16 h-16 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-xl font-extrabold text-slate-700 mb-3">AI Powered Analysis</h3>
                <p className="text-[15px] font-medium max-w-[280px] mx-auto text-slate-500 leading-relaxed">Let our artificial intelligence automatically detect the issue and category from your uploaded images.</p>
              </div>
            ) : (
              <div className="z-10 w-full max-w-sm">

                {/* Scanning Animation */}
                {prediction?.status === 'scanning' && (
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-900 rounded-xl overflow-hidden relative shadow-lg">
                      <img src={prediction.preview} alt="Scanning" className="w-full h-full object-cover opacity-80" />

                      {/* Scanning Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/70 text-green-400 px-4 py-2 rounded font-mono text-sm animate-pulse border border-green-500/50">
                          ANALYZING IMAGE...
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result Display */}
                {prediction?.status === 'complete' && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative w-full h-48 bg-gray-900 rounded-t-xl overflow-hidden">
                      <img src={prediction.preview} alt="Result" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-20"></div>
                      <div className="absolute bottom-3 left-4 text-white">
                        <p className="text-xs text-green-400 font-mono mb-0.5">ANALYSIS COMPLETE</p>
                        <h3 className="text-lg font-bold">{prediction.label.replace(/_/g, " ")}</h3>
                      </div>
                    </div>

                    <div className="bg-white rounded-b-xl shadow-lg border border-gray-100 p-5 text-left">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500">Confidence Score</span>
                        <span className="text-lg font-bold text-indigo-600">{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${prediction.confidence * 100}%` }}
                        ></div>
                      </div>

                      <div className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800 flex gap-2">
                        <span>🤖</span>
                        <span>
                          AI has identified this as <strong>{prediction.label.split('_').pop()}</strong> and auto-selected the category.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
  );

  // Shared map modal and CSS (used by both modes)
  const sharedExtras = (
    <>
      {/* Fullscreen Map Modal for precise selection */}
      {mapModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Choose Exact Location</h3>
                <p className="text-xs text-gray-500">
                  Click anywhere on the map to place the red marker. This location will be saved with your complaint.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1">
              <MapContainer
                center={
                  locationCoords
                    ? [locationCoords.lat, locationCoords.lng]
                    : [12.9716, 77.5946]
                }
                zoom={14}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; Google Maps'
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                />
                <LocationClickLayer onSelect={handleMapLocationSelect} />
                <RecenterOnLocation location={locationCoords} />
                {locationCoords && (
                  <CircleMarker
                    center={[locationCoords.lat, locationCoords.lng]}
                    radius={10}
                    pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }}
                  />
                )}
              </MapContainer>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for Scanning Animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );

  // Modal mode: render as a backdrop overlay
  if (isModalMode) {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {formContent}
        {sharedExtras}
      </div>
    );
  }

  // Inline mode (backward-compatible): render in a full-screen centered layout
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/30 to-slate-200 p-6">
      {formContent}
      {sharedExtras}
    </div>
  );
}

export default AddComplaintModal;
