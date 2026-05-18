import React, { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PARTY_COLORS = {
  "BJP": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "INC": { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  "JD(S)": { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  "IND": { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
};

function getPartyStyle(party = "") {
  const key = Object.keys(PARTY_COLORS).find((k) => party.toUpperCase().includes(k));
  return PARTY_COLORS[key] || { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
}

const MlaCard = memo(function MlaCard({ mla, onSelect }) {
  const ps = getPartyStyle(mla.party);
  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(mla)}
      style={{
        background: "rgba(30,27,75,0.5)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 16,
        padding: 20,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.5)" }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "2px 10px", fontSize: 11, color: "#a5b4fc", fontWeight: 700 }}>#{mla.constituency_number}</div>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12, fontWeight: 800, color: "#fff" }}>{mla.name ? mla.name.charAt(0) : "?"}</div>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e0e7ff", marginBottom: 4 }}>{mla.name}</div>
      <div style={{ color: "#a5b4fc", fontSize: 13, marginBottom: 8 }}>{mla.constituency}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>{mla.party || "N/A"}</span>
        {mla.district && <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 12, fontWeight: 500, background: "rgba(107,114,128,0.15)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.25)" }}>{mla.district}</span>}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "flex", gap: 12 }}>
        {mla.phone_numbers?.length > 0 && <span style={{ fontSize: 12, color: "#6b7280" }}>📞 {mla.phone_numbers[0]}</span>}
        {mla.email && <span style={{ fontSize: 12, color: "#6b7280" }}>✉️ {mla.email.length > 20 ? mla.email.substring(0, 18) + "…" : mla.email}</span>}
        {!mla.phone_numbers?.length && !mla.email && <span style={{ fontSize: 12, color: "#4b5563" }}>No contact info</span>}
      </div>
      {mla.confidence_score >= 0.8 && <div style={{ position: "absolute", bottom: 12, right: 12 }}><span style={{ fontSize: 10, color: "#34d399" }}>✓ Verified</span></div>}
    </motion.div>
  );
});

export default function MlaDirectory() {
  const [mlas, setMlas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedParty, setSelectedParty] = useState("All");
  const [selectedMla, setSelectedMla] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/mlas`)
      .then((r) => r.json())
      .then((data) => { setMlas(data); setFiltered(data); setLoading(false); })
      .catch(() => { setError("Failed to load MLA data."); setLoading(false); });
  }, []);

  useEffect(() => {
    let result = mlas;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m => m.name?.toLowerCase().includes(q) || m.constituency?.toLowerCase().includes(q) || m.district?.toLowerCase().includes(q) || m.party?.toLowerCase().includes(q));
    }
    if (selectedDistrict !== "All") result = result.filter(m => m.district === selectedDistrict);
    if (selectedParty !== "All") result = result.filter(m => m.party?.toUpperCase().includes(selectedParty));
    setFiltered(result);
  }, [search, selectedDistrict, selectedParty, mlas]);

  const districts = ["All", ...Array.from(new Set(mlas.map(m => m.district).filter(Boolean))).sort()];
  const parties = ["All", "BJP", "INC", "JD(S)", "IND"];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#fff", paddingBottom: 60 }}>
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)", borderBottom: "1px solid rgba(99,102,241,0.3)", padding: "48px 24px 32px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏛️</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: 0 }}>Karnataka MLA Directory</h1>
          <p style={{ color: "#a5b4fc", marginTop: 8, fontSize: "1.05rem" }}>Official records from Karnataka Legislative Assembly · {mlas.length} MLAs</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 100, padding: "4px 14px", fontSize: 13, color: "#34d399" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
            Verified · Official PDF Source
          </div>
        </motion.div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 0", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: "1 1 280px", position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, constituency, district, party..." style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(30,27,75,0.6)", color: "#fff", fontSize: "0.95rem", outline: "none" }} />
        </div>
        <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(30,27,75,0.6)", color: "#fff", fontSize: "0.9rem", outline: "none", cursor: "pointer" }}>
          {districts.map(d => <option key={d} value={d} style={{ background: "#1e1b4b" }}>{d === "All" ? "All Districts" : d}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {parties.map(p => (
            <button key={p} onClick={() => setSelectedParty(p)} style={{ padding: "8px 16px", borderRadius: 100, border: selectedParty === p ? "2px solid #818cf8" : "1px solid rgba(255,255,255,0.15)", background: selectedParty === p ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)", color: selectedParty === p ? "#c7d2fe" : "#9ca3af", fontWeight: selectedParty === p ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
              {p}
            </button>
          ))}
        </div>
        <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>Showing <b style={{ color: "#a5b4fc" }}>{filtered.length}</b> of {mlas.length}</span>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div><p style={{ color: "#6b7280" }}>Loading MLA directory...</p></div>
        ) : error ? (
          <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 16, padding: 32, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>❌</div><p style={{ color: "#fca5a5" }}>{error}</p></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div><p style={{ color: "#6b7280" }}>No MLAs found matching your filters.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map((mla) => (
              <MlaCard key={mla._id} mla={mla} onSelect={setSelectedMla} />
            ))}
          </div>
        )}
      </div>

      {selectedMla && (
        <div onClick={() => setSelectedMla(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
            style={{ background: "linear-gradient(135deg, #1e1b4b, #1a1a2e)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 24, padding: 32, maxWidth: 520, width: "100%", position: "relative" }}>
            <button onClick={() => setSelectedMla(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer" }}>×</button>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 16 }}>{selectedMla.name?.charAt(0)}</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{selectedMla.name}</h2>
            <p style={{ color: "#a5b4fc", margin: "0 0 16px", fontSize: "1rem" }}>{selectedMla.constituency} Constituency #{selectedMla.constituency_number}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {(() => { const ps = getPartyStyle(selectedMla.party); return <span style={{ padding: "4px 14px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>{selectedMla.party || "N/A"}</span>; })()}
              {selectedMla.district && <span style={{ padding: "4px 14px", borderRadius: 100, fontSize: 13, background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>📍 {selectedMla.district}</span>}
              <span style={{ padding: "4px 14px", borderRadius: 100, fontSize: 13, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>✓ {selectedMla.verification_status}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedMla.phone_numbers?.length > 0 && <DetailRow icon="📞" label="Mobile" value={selectedMla.phone_numbers.join(", ")} />}
              {selectedMla.landline_numbers?.length > 0 && <DetailRow icon="☎️" label="Landline" value={selectedMla.landline_numbers.join(", ")} />}
              {selectedMla.email && <DetailRow icon="✉️" label="Email" value={selectedMla.email} link={`mailto:${selectedMla.email}`} />}
              {selectedMla.address && <DetailRow icon="🏠" label="Address" value={selectedMla.address} />}
              <DetailRow icon="🔗" label="Source" value="Karnataka Legislative Assembly (Official PDF)" link={selectedMla.source_url} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, link }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 18, flexShrink: 0, width: 26 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
        {link ? <a href={link} target="_blank" rel="noreferrer" style={{ color: "#818cf8", fontSize: 14, wordBreak: "break-all", textDecoration: "none" }}>{value}</a>
          : <div style={{ color: "#e0e7ff", fontSize: 14, wordBreak: "break-word" }}>{value}</div>}
      </div>
    </div>
  );
}
