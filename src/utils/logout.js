import toast from "react-hot-toast";

export const handleLogout = (navigate) => {
  // Clear all localStorage data
  localStorage.removeItem("citizen_username");
  localStorage.removeItem("uid");
  localStorage.removeItem("admin_username");
  localStorage.removeItem("officer_name");

  // Show subtle toast
  toast.success("Successfully logged out", { id: 'logout-toast' });

  // Dispatch auth_changed event
  window.dispatchEvent(new Event("auth_changed"));

  // Navigate back to home securely
  navigate("/");
};
