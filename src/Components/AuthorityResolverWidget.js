import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Building2, AlertCircle, ChevronDown, ChevronUp, MapPin, Briefcase } from 'lucide-react';
import { API_URL } from '../config';

const AuthorityResolverWidget = ({ location, issueType, lat, lng }) => {
  const [authorityData, setAuthorityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if ((!location && !lat) || !issueType) return;

    const fetchAuthority = async () => {
      setLoading(true);
      try {
        let url;
        if (lat && lng) {
          url = `${API_URL}/api/authorities/resolve?lat=${lat}&lng=${lng}&issue=${encodeURIComponent(issueType)}`;
        } else {
          url = `${API_URL}/api/authorities/resolve?area=${encodeURIComponent(location)}&issue=${encodeURIComponent(issueType)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch authority data');
        const data = await response.json();
        setAuthorityData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthority();
  }, [location, issueType, lat, lng]);

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-pulse flex items-center justify-center h-24">
        <div className="flex items-center gap-2 text-indigo-400">
          <Shield className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Resolving Authorities...</span>
        </div>
      </div>
    );
  }

  if (error || !authorityData) {
    return (
      <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="text-sm text-red-700">
          <strong>Authority Resolution Failed</strong>
          <p className="mt-1 opacity-80">We could not determine the responsible authorities for this location.</p>
        </div>
      </div>
    );
  }

  const { location_context, elected, excel_data, administrative } = authorityData;
  const mla = elected?.find(e => e.role === 'MLA');
  const mp = elected?.find(e => e.role === 'MP');
  const primaryDept = administrative?.find(a => a.role === 'Department');
  const primaryOfficer = administrative?.find(a => a.role === 'Primary Officer');

  // Check if we are outside BBMP
  if (!location_context?.ward_no) {
    return (
      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <strong>Location detected outside BBMP jurisdiction.</strong>
            <p className="mt-1 opacity-80">Ward mapping unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  // Admin Zone Fallback
  const adminZone = excel_data?.adminZone || location_context?.zone_name || 'General Zone';
  const groundWingLabel = primaryOfficer?.designation && primaryOfficer?.department 
    ? `${primaryOfficer.designation} - ${primaryOfficer.department}` 
    : (primaryDept?.name || 'Department Officer');

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
      {/* Header (Always Visible) */}
      <div 
        className="bg-gradient-to-r from-indigo-50 to-white p-4 flex justify-between items-center cursor-pointer hover:bg-indigo-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Who is Responsible?</h3>
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Ward #{location_context.ward_no} • {issueType}
            </p>
          </div>
        </div>
        <div className="text-indigo-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Content: The Tree Flow */}
      <motion.div 
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="p-6 border-t border-indigo-50 bg-slate-50/30">
          
          <div className="flex flex-col items-center">
            {/* Root Node */}
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md z-10 font-medium text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Your Ward: Ward #{location_context.ward_no} - {location_context.ward_name || 'Unknown'}
            </div>
            
            {/* Connector */}
            <div className="h-6 w-px bg-indigo-200"></div>

            {/* Tier 1: Political Cards (MLA & MP) */}
            <div className="relative w-full max-w-sm">
              {/* Horizontal line connecting MLA and MP */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-indigo-200 border-t border-indigo-200"></div>
              {/* Vertical lines connecting horizontal line to cards */}
              <div className="absolute top-0 left-1/4 h-4 w-px bg-indigo-200"></div>
              <div className="absolute top-0 right-1/4 h-4 w-px bg-indigo-200"></div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                {/* MLA Card */}
                <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-sm flex flex-col items-center text-center z-10 relative">
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-2">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">MLA</span>
                  <h4 className="text-sm font-semibold text-gray-900 leading-tight">{mla?.name || 'Unassigned'}</h4>
                </div>

                {/* MP Card */}
                <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm flex flex-col items-center text-center z-10 relative">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">MP</span>
                  <h4 className="text-sm font-semibold text-gray-900 leading-tight">{mp?.name || 'Unassigned'}</h4>
                </div>
              </div>
            </div>

            {/* Connector to Tier 2 (from the center of Tier 1) */}
            <div className="h-8 w-px bg-indigo-200 mt-2"></div>

            {/* Tier 2: Administrative Node (Zonal Commissioner) */}
            <div className="bg-amber-50 border border-amber-100 px-6 py-3 rounded-xl shadow-sm z-10 flex flex-col items-center text-center max-w-[250px] w-full">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600 mb-2 shadow-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Administrative Oversight</span>
              <h4 className="text-sm font-semibold text-gray-900 leading-tight">Zonal Commissioner - {adminZone}</h4>
            </div>

            {/* Connector to Tier 3 */}
            <div className="h-8 w-px bg-indigo-200 mt-0"></div>

            {/* Tier 3: Ground Staff */}
            <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-xl shadow-sm z-10 flex flex-col items-center text-center max-w-[250px] w-full">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Ground Level Staff</span>
              <h4 className="text-sm font-semibold text-gray-900 leading-tight">{groundWingLabel}</h4>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default AuthorityResolverWidget;
