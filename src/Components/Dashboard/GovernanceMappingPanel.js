import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Building2, Users, Briefcase, MapPin, Shield, RefreshCw } from 'lucide-react';

const GovernanceMappingPanel = () => {
  const [activeTab, setActiveTab] = useState('issues');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ wards: 0, mlas: 0, mps: 0, issues: 0 });

  const tabs = [
    { id: 'issues', label: 'Issue → Department', icon: Briefcase },
    { id: 'elected', label: 'Elected Representatives', icon: Users },
    { id: 'wards', label: 'Ward Boundaries', icon: MapPin },
  ];

  useEffect(() => {
    fetchStats();
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const [issueRes, electedRes] = await Promise.all([
        fetch(`${API_URL}/api/governance/stats`),
        fetch(`${API_URL}/api/governance/elected-representatives`),
      ]);
      const issueData = await issueRes.json();
      const electedData = await electedRes.json();
      setStats({
        issues: issueData.count || 0,
        mlas: (electedData.data || []).filter(r => r.role === 'mla').length,
        mps: (electedData.data || []).filter(r => r.role === 'mp').length,
        wards: issueData.wardCount || 0,
      });
    } catch (err) {
      // Stats are non-critical
    }
  };

  const fetchTabData = async (tab) => {
    setLoading(true);
    try {
      let url;
      if (tab === 'issues') url = `${API_URL}/api/governance/issue-mappings`;
      else if (tab === 'elected') url = `${API_URL}/api/governance/elected-representatives`;
      else if (tab === 'wards') url = `${API_URL}/api/governance/ward-summary`;
      
      const res = await fetch(url);
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-violet-100 p-3 rounded-xl text-violet-600">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Governance Mapping</h2>
          <p className="text-sm text-slate-500">Manage accountability chain data</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <p className="text-[10px] font-bold text-indigo-500 uppercase">Ward Boundaries</p>
          <p className="text-2xl font-black text-indigo-700">{stats.wards}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-[10px] font-bold text-purple-500 uppercase">MLAs</p>
          <p className="text-2xl font-black text-purple-700">{stats.mlas}</p>
        </div>
        <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
          <p className="text-[10px] font-bold text-fuchsia-500 uppercase">MPs</p>
          <p className="text-2xl font-black text-fuchsia-700">{stats.mps}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-500 uppercase">Issue Rules</p>
          <p className="text-2xl font-black text-emerald-700">{stats.issues}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-indigo-700 border-indigo-600 bg-indigo-50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-semibold">No data found</p>
            <p className="text-xs mt-1">Run the seed script or upload data via Excel.</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {activeTab === 'issues' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Issue Type</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Primary Officer</th>
                    <th className="px-4 py-3 text-left">Escalation</th>
                    <th className="px-4 py-3 text-left">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.issue_type}</td>
                      <td className="px-4 py-3 text-slate-600">{row.primary_department}</td>
                      <td className="px-4 py-3 text-slate-600">{row.primary_designation}</td>
                      <td className="px-4 py-3 text-slate-600">{row.escalation_designation}</td>
                      <td className="px-4 py-3">
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">
                          {row.sla_days || 7}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'elected' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Constituency</th>
                    <th className="px-4 py-3 text-left">Party</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          row.role === 'mla' ? 'bg-violet-100 text-violet-700' :
                          row.role === 'mp' ? 'bg-fuchsia-100 text-fuchsia-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {row.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.constituency_name || '—'}</td>
                      <td className="px-4 py-3">
                        {row.party && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.party === 'BJP' ? 'bg-orange-100 text-orange-700' :
                            row.party === 'INC' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {row.party}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          row.term_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          row.term_status === 'vacant' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.term_status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'wards' && (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Ward No</th>
                    <th className="px-4 py-3 text-left">Ward Name</th>
                    <th className="px-4 py-3 text-left">Assembly Constituency</th>
                    <th className="px-4 py-3 text-left">Parliamentary Constituency</th>
                    <th className="px-4 py-3 text-left">Population</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">{row.ward_no}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.ward_name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.assembly_constituency_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.parliamentary_constituency_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{row.population ? row.population.toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceMappingPanel;
