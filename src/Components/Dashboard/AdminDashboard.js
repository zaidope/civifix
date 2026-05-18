import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminTable from "./AdminTable";
import AuthorityDataUpload from "./AuthorityDataUpload";
import GovernanceMappingPanel from "./GovernanceMappingPanel";
import SideDash from "./SideDash";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { handleLogout } from "../../utils/logout";
import { API_URL } from "../../config";

function AdminDashboard() {
  const navigate = useNavigate();
  const [numOfComplaints, setNoOfComplaints] = useState(0);
  const [complaintsResolved, setComplaintsResolved] = useState(0);
  const [statusModal, openStatusModal] = useState(false);
  const [usernameToRemove, setUsernameToRemove] = useState("");
  const [comments, setComments] = useState("");
  const [activeTab, setActiveTab] = useState("complaints");

  useEffect(() => {
    const adminUser = localStorage.getItem("admin_username");
    if (!adminUser) {
      navigate("/login");
    }
  }, [navigate]);

  // Calculate pending complaints
  const pendingComplaints = numOfComplaints - complaintsResolved;

  const sendData = async (e) => {
    e.preventDefault();
    if (!usernameToRemove) {
      alert("Please enter a username to remove.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/removeUser/${usernameToRemove}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        alert(`✅ Citizen '${usernameToRemove}' removed successfully.`);
        openStatusModal(false);
        setUsernameToRemove("");
        setComments("");
      } else {
        alert("❌ Failed to remove user. Try again.");
      }
    } catch (err) {
      alert("❌ Server error. Please try again later.");
    }
  };

  return (
    <div className="w-full flex relative">
        {/* Hidden trigger button for navbar */}
        <button
          data-remove-citizen
          onClick={() => openStatusModal(true)}
          className="hidden"
        >
          Hidden Trigger
        </button>

        {/* Remove Citizen Modal */}
        {statusModal && (
          <div className="z-10 bg-black bg-opacity-50 flex justify-center items-center fixed inset-0">
            <div className="bg-white p-6 w-[450px] rounded-lg text-center shadow-lg">
              <form onSubmit={sendData}>
                <h2 className="text-xl font-bold mb-4 text-indigo-600">
                  Remove Citizen Account
                </h2>

                <div className="mb-4">
                  <input
                    onChange={(e) => setUsernameToRemove(e.target.value)}
                    value={usernameToRemove}
                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
                    name="username"
                    type="text"
                    required
                    placeholder="Enter Citizen Username"
                  />
                </div>

                <div className="mb-6">
                  <textarea
                    onChange={(e) => setComments(e.target.value)}
                    value={comments}
                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
                    name="comments"
                    rows="2"
                    placeholder="Optional comments..."
                  />
                </div>

                <div className="flex justify-center items-center gap-3">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-semibold"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => openStatusModal(false)}
                    type="button"
                    className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sidebar + Table */}
        <SideDash
          head="Admin Dashboard"
          totalComplaints={numOfComplaints}
          resolvedComplaints={complaintsResolved}
          pendingComplaints={pendingComplaints}
        />

        <div className="w-4/5 p-4 bg-gray-50">
          <div className="mb-6 flex gap-4 border-b border-gray-200 pb-2">
            <button 
              onClick={() => setActiveTab('complaints')}
              className={`pb-2 px-1 font-semibold text-sm ${activeTab === 'complaints' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Complaints Directory
            </button>
            <button 
              onClick={() => setActiveTab('authority')}
              className={`pb-2 px-1 font-semibold text-sm ${activeTab === 'authority' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Authority Data Upload
            </button>
            <button 
              onClick={() => setActiveTab('governance')}
              className={`pb-2 px-1 font-semibold text-sm ${activeTab === 'governance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Governance Mapping
            </button>
          </div>

          {activeTab === 'complaints' ? (
            <AdminTable
              numOfComplaints={numOfComplaints}
              setNoOfComplaints={setNoOfComplaints}
              complaintsFwded={complaintsResolved}
              setComplaintsFwded={setComplaintsResolved}
            />
          ) : activeTab === 'authority' ? (
            <AuthorityDataUpload />
          ) : (
            <GovernanceMappingPanel />
          )}
        </div>
      </div>
  );
}

export default AdminDashboard;
