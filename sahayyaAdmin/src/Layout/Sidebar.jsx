import React, { useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { hasModulePermission } from "../utiles/adminPermissions";
import { toast } from "react-toastify";

const Sidebar = ({ onLinkClick }) => {
  const location = useLocation();
  const activePath = location.pathname;

  const loginDetails = JSON.parse(localStorage.getItem("login_details")) || {};
  const email = loginDetails.email || "Support@sahayya.co.in";
  const role = loginDetails.role || "Admin";
  const menuItems = useMemo(
    () => [
      hasModulePermission("dashboard") && ["/admin/dashboard", "fas fa-tachometer-alt", "Dashboard"],
      hasModulePermission("house_owners") && ["/admin/house-owners", "fas fa-home", "House Owners"],
      hasModulePermission("staff") && ["/admin/allStaff", "fas fa-users", "Staff"],
      hasModulePermission("jobs") && ["/admin/jobs", "fas fa-briefcase", "Job Postings"],
      hasModulePermission("roles") && ["/admin/addrole", "fas fa-user-tag", "Add Role"],
      hasModulePermission("membership") && ["/admin/membership", "fas fa-crown", "Membership"],
      hasModulePermission("staff") && ["/admin/salary", "fas fa-money-bill-wave", "Salary Payouts"],
      hasModulePermission("reports") && ["/admin/reports", "fas fa-chart-bar", "Reports"],
      hasModulePermission("blacklist") && ["/admin/blacklist", "fas fa-user-slash", "Blacklist"],
      hasModulePermission("sub_admins") && ["/admin/admin-users", "fas fa-user-shield", "Admin Users"],
      hasModulePermission("settings") && ["/admin/settings", "fas fa-cog", "Settings"],
      hasModulePermission("settings") && ["/admin/legal-consents", "fas fa-file-signature", "Legal Consents"],
      hasModulePermission("settings") && ["/admin/training-videos", "fas fa-play-circle", "Training Videos"],


      ["/", "fas fa-sign-out-alt", "Logout"],
    ].filter(Boolean),
    []
  );

  const handleMenuClick = (path) => {
    if (path === "/") {
      toast.dismiss();
      localStorage.removeItem("token");
      localStorage.removeItem("login_details");
      localStorage.removeItem("user_id");
      localStorage.removeItem("role");
      window.location.href = "/";
      return;
    }
    onLinkClick && onLinkClick();
  };

  const navItem = (to, iconClass, label) => (
    <li className="nav-item" key={to}>
      <Link
        to={to}
        onClick={() => handleMenuClick(to)}
        className={`sidebar-link ${activePath === to ? "active-link" : ""}`}
      >
        <span className="sidebar-icon">
          <i className={iconClass}></i>
        </span>
        <span className="sidebar-label">{label}</span>
      </Link>
    </li>
  );

  return (
    <div className="sidebar-wrapper">
      {/* Brand / Logo area inside sidebar */}
      {/* <div className="sidebar-brand">
        <span className="sidebar-brand-icon">S</span>
        <span className="sidebar-brand-name">Sahayya</span>
      </div> */}

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <ul className="nav flex-column gap-1">
          {menuItems.map(([to, icon, label]) => navItem(to, icon, label))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer-user">
        <img
          src="https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg"
          alt="Admin"
          className="sidebar-avatar"
        />
        <div className="sidebar-user-info">
          <div className="sidebar-user-email">{email}</div>
          <div className="sidebar-user-role">{role}</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
