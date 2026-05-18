import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, User, Building2, Phone, Mail, AlertCircle,
  ChevronDown, ChevronUp, MapPin, Briefcase, Clock,
  ArrowRight, ExternalLink, Info
} from 'lucide-react';
import { API_URL } from '../config';

/**
 * AccountabilityChain — NammaKasa-style two-branch accountability tree.
 * 
 * Props:
 *   complaintId  — fetch from stored snapshot
 *   lat, lng     — GPS coordinates for live resolution
 *   issueType    — complaint category
 *   location     — text location (fallback)
 */
const AccountabilityChain = ({ complaintId, lat, lng, issueType, location }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded || data) return; // Only fetch if expanded and not already loaded

    const fetchChain = async () => {
      setLoading(true);
      setError(null);
      try {
        let url;
        if (complaintId) {
          url = `${API_URL}/api/authorities/accountability-chain/${complaintId}`;
        } else if (lat && lng && issueType) {
          url = `${API_URL}/api/authorities/resolve?lat=${lat}&lng=${lng}&issue=${encodeURIComponent(issueType)}`;
        } else if (location && issueType) {
          url = `${API_URL}/api/authorities/resolve?area=${encodeURIComponent(location)}&issue=${encodeURIComponent(issueType)}`;
        } else {
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch accountability chain');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChain();
  }, [complaintId, lat, lng, issueType, location, isExpanded, data]);

  // If expanded and loading, show skeleton inside the expanded panel, not the entire component!
  // This allows the header to always render immediately and smoothly.


  const loc = data?.location_context || {};
  const admin = data?.administrative || [];
  const elected = data?.elected || [];
  const isPolygonResolved = data?.source_trust?.method === 'polygon' || data?.source_trust?.method === 'snapshot';

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      {/* Header — Always Visible */}
      <div
        className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-4 cursor-pointer hover:from-indigo-700 hover:to-violet-800 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Accountability Chain</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {loc.area_name ? (
                  <span className="text-xs text-indigo-200 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {loc.area_name}
                  </span>
                ) : (
                  <span className="text-xs text-indigo-200/80 font-medium flex items-center gap-1">
                    🔍 Click to resolve responsible authorities
                  </span>
                )}
                {loc.ward_name && (
                  <span className="text-xs text-indigo-300">
                    • Ward {loc.ward_no || ''}: {loc.ward_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPolygonResolved && data && (
              <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            )}
            <div className="text-white/70">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-5 space-y-5">
          {loading && (
            <div className="space-y-4 py-2 animate-pulse">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400 animate-spin" />
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div className="h-10 bg-slate-50 rounded-xl"></div>
              <div className="h-24 bg-slate-50 rounded-xl"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">Accountability Chain Unavailable</p>
                <p className="text-xs text-red-600 mt-1 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !data && (
            <div className="text-center py-4 text-xs text-gray-500">
              No accountability data loaded. Click to fetch details.
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Ward Badge */}
              {loc.ward_name && (
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Your Ward</span>
                      <h4 className="text-lg font-bold text-gray-900 mt-0.5">
                        {loc.area_name || loc.ward_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Ward {loc.ward_no}: {loc.ward_name}
                        {loc.zone_name && ` • ${loc.zone_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {data.sla_days && (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{data.sla_days} day SLA</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Routing Rationale */}
              {data.routing_rationale && (
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 italic leading-relaxed">{data.routing_rationale}</p>
                </div>
              )}

              {/* Two Branch Layout */}
              <div className="space-y-4">

                {/* Branch 1: Administrative Ownership */}
                <div className="border border-emerald-100 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Administrative Ownership</span>
                  </div>
                  <div className="p-4 space-y-0">
                    {admin.map((officer, i) => (
                      <div key={i} className="relative">
                        {/* Connector line */}
                        {i > 0 && (
                          <div className="absolute left-5 -top-0 w-0.5 h-3 bg-emerald-200"></div>
                        )}
                        <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                            i === 0 ? 'bg-emerald-100 text-emerald-700' :
                            i === 1 ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {i === 0 ? '🏢' : i === 1 ? '👤' : '⬆️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{officer.role}</span>
                            <h5 className="text-sm font-bold text-gray-900 mt-0.5">{officer.name || 'Unassigned'}</h5>
                            {officer.designation && (
                              <p className="text-xs text-gray-500 mt-0.5">{officer.designation}
                                {officer.department && officer.department !== officer.name ? ` • ${officer.department}` : ''}
                              </p>
                            )}
                            {/* Contact buttons */}
                            <div className="flex gap-2 mt-2">
                              {officer.phone && officer.phone !== '1533' && (
                                <a href={`tel:${officer.phone}`} className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100 transition">
                                  <Phone className="w-3 h-3" /> {officer.phone}
                                </a>
                              )}
                              {officer.email && (
                                <a href={`mailto:${officer.email}`} className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition">
                                  <Mail className="w-3 h-3" /> Email
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Arrow connector */}
                        {i < admin.length - 1 && (
                          <div className="flex justify-center py-0.5">
                            <ArrowRight className="w-3 h-3 text-emerald-300 rotate-90" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch 2: Elected Representatives */}
                <div className="border border-purple-100 rounded-xl overflow-hidden">
                  <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Elected Representatives</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {elected.map((rep, i) => {
                      const isVacant = rep.status === 'vacant' || rep.name === 'Vacant';
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${isVacant ? 'bg-gray-50 opacity-60' : 'hover:bg-purple-50/30'} transition-colors`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isVacant ? 'bg-gray-200 text-gray-400' :
                            i === 0 ? 'bg-purple-100 text-purple-700' :
                            i === 1 ? 'bg-violet-100 text-violet-700' :
                            'bg-fuchsia-100 text-fuchsia-700'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{rep.role}</span>
                            <h5 className={`text-sm font-bold mt-0.5 ${isVacant ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                              {isVacant ? 'Vacant Seat' : rep.name}
                            </h5>
                            {rep.constituency && (
                              <p className="text-xs text-gray-500 mt-0.5">{rep.constituency}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              {rep.party && !isVacant && (
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  rep.party === 'BJP' ? 'bg-orange-100 text-orange-700' :
                                  rep.party === 'INC' ? 'bg-blue-100 text-blue-700' :
                                  rep.party === 'JDS' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {rep.party}
                                </span>
                              )}
                              {isVacant && (
                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  No elected representative
                                </span>
                              )}
                              {rep.phone && !isVacant && (
                                <a href={`tel:${rep.phone}`} className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md hover:bg-purple-100 transition">
                                  <Phone className="w-3 h-3" /> Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ULB Badge */}
              {data.ulb && (
                <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Governing Body</span>
                    <h5 className="text-sm font-semibold text-gray-900">{data.ulb.ulb_name || 'BBMP'}</h5>
                  </div>
                </div>
              )}

              {/* Footer — Data Trust */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {isPolygonResolved ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      ✓ Resolved via ward polygon match
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      ⚠ Approximate resolution (text match)
                    </span>
                  )}
                </div>
                {data.source_trust?.last_verified_at && (
                  <span className="text-[10px] text-gray-400">
                    Verified: {new Date(data.source_trust.last_verified_at).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AccountabilityChain;
