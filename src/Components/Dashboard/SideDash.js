import React from "react";
import { FileText, Send, Clock } from "lucide-react";

function SideDash({ head, totalComplaints, resolvedComplaints, pendingComplaints }) {
  return (
    <aside className="my-5 mx-2">
      <div className="h-full w-72 flex flex-col items-center justify-start">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-full shadow-md border rounded-xl p-4 mb-6 text-center">
          <h2 className="text-white text-lg font-semibold tracking-wide">
            {head || "Admin Dashboard"}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            Real-time complaint analytics
          </p>
        </div>

        {/* BOX 01: Total Complaints */}
        <div className="bg-white w-full shadow-sm border rounded-xl mt-4 flex flex-col justify-center items-center py-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-center gap-2 mb-2 text-blue-700">
            <FileText size={20} />
            <p className="font-semibold text-sm text-center">
              Total Complaints
            </p>
          </div>
          <span className="text-blue-600 text-4xl font-bold">
            {totalComplaints || 0}
          </span>
        </div>

        {/* BOX 02: Resolved Complaints */}
        <div className="bg-white w-full shadow-sm border rounded-xl mt-4 flex flex-col justify-center items-center py-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-center gap-2 mb-2 text-green-700">
            <Send size={20} />
            <p className="font-semibold text-sm text-center">
              Complaints Resolved
            </p>
          </div>
          <span className="text-green-600 text-4xl font-bold">
            {resolvedComplaints || 0}
          </span>
        </div>

        {/* BOX 03: Pending Complaints */}
        <div className="bg-white w-full shadow-sm border rounded-xl mt-4 flex flex-col justify-center items-center py-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-center gap-2 mb-2 text-yellow-700">
            <Clock size={20} />
            <p className="font-semibold text-sm text-center">
              Pending Complaints
            </p>
          </div>
          <span className="text-yellow-600 text-4xl font-bold">
            {pendingComplaints || 0}
          </span>
        </div>

        {/* Optional: Footer */}
        <div className="text-gray-400 text-xs mt-6 text-center">
          © 2025 Citizen Grievance Portal
        </div>
      </div>
    </aside>
  );
}

export default SideDash;
