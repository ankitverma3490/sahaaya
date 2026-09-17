export const ADMIN_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "house_owners", label: "House Owners" },
  { key: "staff", label: "Staff" },
  { key: "jobs", label: "Job Postings" },
  { key: "roles", label: "Add Role" },
  { key: "membership", label: "Membership" },
  { key: "reports", label: "Reports" },
  { key: "blacklist", label: "Blacklist" },
  { key: "sub_admins", label: "Admin Users" },
  { key: "settings", label: "Settings" },
];

export const DEFAULT_ADMIN_PERMISSIONS = ADMIN_MODULES.map((module) => module.key);
export const MODULE_ROUTE_MAP = {
  dashboard: "/admin/dashboard",
  house_owners: "/admin/house-owners",
  staff: "/admin/allStaff",
  jobs: "/admin/jobs",
  roles: "/admin/addrole",
  membership: "/admin/membership",
  reports: "/admin/reports",
  blacklist: "/admin/blacklist",
  sub_admins: "/admin/admin-users",
  settings: "/admin/settings",
};

export const getAdminDetails = () => {
  try {
    return JSON.parse(localStorage.getItem("login_details")) || {};
  } catch (error) {
    return {};
  }
};

export const getAdminPermissions = () => {
  const details = getAdminDetails();
  const permissions = Array.isArray(details?.permissions) ? details.permissions : [];

  if (!details?.is_admin_panel_user) {
    return DEFAULT_ADMIN_PERMISSIONS;
  }

  if (permissions.length === 0) {
    return DEFAULT_ADMIN_PERMISSIONS;
  }

  return permissions;
};

export const hasModulePermission = (moduleKey) => {
  return getAdminPermissions().includes(moduleKey);
};

export const getDefaultAdminRoute = () => {
  const permissions = getAdminPermissions();
  const firstModule = ADMIN_MODULES.find((module) => permissions.includes(module.key));
  return MODULE_ROUTE_MAP[firstModule?.key] || "/admin/dashboard";
};
