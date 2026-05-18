import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const TYPE_COLORS = {
  "Mahanagara Palike": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", icon: "🏛" },
  "City Corporation": { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD", icon: "🏙" },
  "City Municipal Council": { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7", icon: "🏢" },
  "Town Municipal Council": { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC", icon: "🏘" },
  "Town Panchayat": { bg: "#F3E8FF", text: "#6B21A8", border: "#C4B5FD", icon: "🏡" },
};

function getTypeStyle(type = "") {
  return TYPE_COLORS[type] || { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB", icon: "🏗" };
}

export default function UlbDirectory() {
  const [ulbs, setUlbs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedUlb, setSelectedUlb] = useState(null);
  const [ulbDetail, setUlbDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/ulbs`)
      .then((r) => r.json())
      .then((data) => { setUlbs(data); setFiltered(data); setLoading(false); })
      .catch(() => { setError("Failed to load ULB data. Ensure the backend is running."); setLoading(false); });
  }, []);

  useEffect(() => {
    let result = ulbs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m => m.ulb_name?.toLowerCase().includes(q) || m.district?.toLowerCase().includes(q));
    }
    if (selectedDistrict !== "All") result = result.filter(m => m.district === selectedDistrict);
    if (selectedType !== "All") result = result.filter(m => m.ulb_type === selectedType);
    setFiltered(result);
  }, [search, selectedDistrict, selectedType, ulbs]);

  const openDetail = async (ulb) => {
    setSelectedUlb(ulb);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/api/ulbs/${ulb._id}`);
      const data = await res.json();
      setUlbDetail(data);
    } catch { setUlbDetail(null); }
    setLoadingDetail(false);
  };

  const districts = ["All", ...Array.from(new Set(ulbs.map(m => m.district).filter(Boolean))).sort()];
  const types = ["All", "Mahanagara Palike", "City Corporation", "City Municipal Council", "Town Municipal Council", "Town Panchayat"];

  const stats = {
    total: ulbs.length,
    cc: ulbs.filter(u => u.ulb_type === "City Corporation" || u.ulb_type === "Mahanagara Palike").length,
    cmc: ulbs.filter(u => u.ulb_type === "City Municipal Council").length,
    tmc: ulbs.filter(u => u.ulb_type === "Town Municipal Council").length,
    tp: ulbs.filter(u => u.ulb_type === "Town Panchayat").length,
    districts: new Set(ulbs.map(u => u.district)).size,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#fff", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)", borderBottom: "1px solid rgba(16,185,129,0.3)", padding: "48px 24px 32px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏛️</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: 0 }}>Urban Local Authorities</h1>
          <p style={{ color: "#6ee7b7", marginTop: 8, fontSize: "1.05rem" }}>
            Official Karnataka ULB Registry · {stats.total} Urban Local Bodies across {stats.districts} Districts
          </p>
          <div style={{ display: "inline-flex", gap: 6, marginTop: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 100, padding: "4px 14px", fontSize: 13, color: "#34d399" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block", marginTop: 5 }} />
            Verified · Official Government Sources
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
            {[
              { label: "City Corp.", value: stats.cc, color: "#93C5FD" },
              { label: "CMC", value: stats.cmc, color: "#6EE7B7" },
              { label: "TMC", value: stats.tmc, color: "#A5B4FC" },
              { label: "Town Panch.", value: stats.tp, color: "#C4B5FD" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 0", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: "1 1 280px", position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ULB name, district..." style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(6,78,59,0.4)", color: "#fff", fontSize: "0.95rem", outline: "none" }} />
        </div>
        <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(6,78,59,0.4)", color: "#fff", fontSize: "0.9rem", outline: "none", cursor: "pointer" }}>
          {districts.map(d => <option key={d} value={d} style={{ background: "#064e3b" }}>{d === "All" ? "All Districts" : d}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {types.map(t => (
            <button key={t} onClick={() => setSelectedType(t)} style={{ padding: "8px 16px", borderRadius: 100, border: selectedType === t ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.15)", background: selectedType === t ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)", color: selectedType === t ? "#6ee7b7" : "#9ca3af", fontWeight: selectedType === t ? 700 : 500, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
              {t === "All" ? "All Types" : t}
            </button>
          ))}
        </div>
        <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>
          Showing <b style={{ color: "#6ee7b7" }}>{filtered.length}</b> of {ulbs.length}
        </span>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div><p style={{ color: "#6b7280" }}>Loading ULB directory...</p></div>
        ) : error ? (
          <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 16, padding: 32, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>❌</div><p style={{ color: "#fca5a5" }}>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div><p style={{ color: "#6b7280" }}>No ULBs match your filters.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map((ulb, i) => {
              const ts = getTypeStyle(ulb.ulb_type);
              return (
                <motion.div key={ulb._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4) }}
                  onClick={() => openDetail(ulb)}
                  style={{ background: "rgba(6,78,59,0.3)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                  whileHover={{ scale: 1.02, borderColor: "rgba(16,185,129,0.4)" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                      {ts.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e0e7ff", marginBottom: 4, lineHeight: 1.3 }}>{ulb.ulb_name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>{ulb.ulb_type}</span>
                        <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, background: "rgba(107,114,128,0.15)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.25)" }}>📍 {ulb.district}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {ulb.website && <a href={ulb.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: "#34d399", textDecoration: "none" }}>🌐 Official Portal</a>}
                    {ulb.office_phone && <span style={{ fontSize: 12, color: "#6b7280" }}>📞 {ulb.office_phone}</span>}
                    {ulb.commissioner_name && <span style={{ fontSize: 12, color: "#6b7280" }}>👤 {ulb.commissioner_name}</span>}
                  </div>
                  {ulb.confidence_score >= 0.8 && <div style={{ position: "absolute", top: 12, right: 12 }}><span style={{ fontSize: 10, color: "#34d399" }}>✓ Verified</span></div>}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedUlb && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedUlb(null); setUlbDetail(null); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} onClick={e => e.stopPropagation()}
              style={{ background: "linear-gradient(135deg, #064e3b, #0f1117)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 24, padding: 32, maxWidth: 600, width: "100%", position: "relative", maxHeight: "85vh", overflowY: "auto" }}>
              <button onClick={() => { setSelectedUlb(null); setUlbDetail(null); }} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer" }}>×</button>

              {/* ULB Header */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  {getTypeStyle(selectedUlb.ulb_type).icon}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#fff" }}>{selectedUlb.ulb_name}</h2>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {(() => { const ts = getTypeStyle(selectedUlb.ulb_type); return <span style={{ padding: "3px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700, background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>{selectedUlb.ulb_type}</span>; })()}
                    <span style={{ padding: "3px 12px", borderRadius: 100, fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>📍 {selectedUlb.district}</span>
                    <span style={{ padding: "3px 12px", borderRadius: 100, fontSize: 12, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>✓ {selectedUlb.verification_status || "Verified"}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {selectedUlb.website && <DetailRow icon="🌐" label="Official Portal" value={selectedUlb.website} link={selectedUlb.website} />}
                {selectedUlb.office_phone && <DetailRow icon="📞" label="Office Phone" value={selectedUlb.office_phone} />}
                {selectedUlb.office_email && <DetailRow icon="✉️" label="Email" value={selectedUlb.office_email} link={`mailto:${selectedUlb.office_email}`} />}
                {selectedUlb.office_address && <DetailRow icon="🏠" label="Address" value={selectedUlb.office_address} />}
                <DetailRow icon="🔗" label="Source" value={selectedUlb.source_url || "Official District Page"} link={selectedUlb.source_url} />
              </div>

              {/* Departments & Officials */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Departments & Officers</h3>
              {loadingDetail ? (
                <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>Loading department details...</div>
              ) : ulbDetail?.officials?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ulbDetail.officials.map((off, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e7ff" }}>{off.department}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{off.designation} · {off.officer_name}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {off.phone && <div style={{ fontSize: 12, color: "#34d399" }}>📞 {off.phone}</div>}
                        {off.email && <div style={{ fontSize: 11, color: "#6b7280" }}>✉️ {off.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                  Officer details will be enriched via official ULB portal scraping.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ icon, label, value, link }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 18, flexShrink: 0, width: 26 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
        {link ? <a href={link} target="_blank" rel="noreferrer" style={{ color: "#34d399", fontSize: 14, wordBreak: "break-all", textDecoration: "none" }}>{value}</a>
          : <div style={{ color: "#e0e7ff", fontSize: 14, wordBreak: "break-word" }}>{value}</div>}
      </div>
    </div>
  );
}
