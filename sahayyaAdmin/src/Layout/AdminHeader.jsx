import React from "react";
import "./Sidebar.css";

const AdminHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const loginDetails = JSON.parse(localStorage.getItem("login_details")) || {};
  const displayName = loginDetails.name || loginDetails.email || "Admin";
  const displayRole = loginDetails.role || "Admin";

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        {/* Left: Hamburger + Brand */}
        <div className="header-left">
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <span className={`hamburger-icon ${sidebarOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div className="brand-text">
            <span className="brand-icon">S</span>
            <h5 className="brand-name">Sahayya Admin</h5>
          </div>
        </div>

        {/* Right: User Info */}
        <div className="header-right">
          <div className="user-avatar">S</div>
          <div className="user-info d-none d-sm-block">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{displayRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
