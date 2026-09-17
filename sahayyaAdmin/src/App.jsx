import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import ScrollToTop from "./Layout/ScrollToTop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Auth
import MainLogin from "./Auth/MainLogin";
// Admin
import AdminDashboard from "./AdminPanel/AdminDashboard";
import MainLayout from "./Layout/MainLayout";

import HouseOwners from "./AdminPanel/HouseOwners";
import StaffManagement from "./AdminPanel/StaffManagement";
import AttendanceManagement from "./AdminPanel/AttendanceManagement";
import AadhaarKyc from "./AdminPanel/AadhaarKyc";
import JobPostings from "./AdminPanel/JobPostings";
import LeaveManagement from "./AdminPanel/LeaveManagement";
import SalaryManagement from "./AdminPanel/SalaryManagement";
import Membership from "./AdminPanel/Membership";
import Notifications from "./AdminPanel/Notifications";
import Addrole from "./AdminPanel/Addrole";
import AllStaff from "./AdminPanel/AllStaff";
import Reports from "./AdminPanel/Reports";
import Settings from "./AdminPanel/Settings";
import JobApplyLimits from "./AdminPanel/JobApplyLimits";
import AdminUsers from "./AdminPanel/AdminUsers";
import BlacklistManagement from "./AdminPanel/BlacklistManagement";
import LegalConsentLogs from "./AdminPanel/LegalConsentLogs";
import TrainingVideoManagement from "./AdminPanel/TrainingVideoManagement";
import Unauthorized from "./AdminPanel/Unauthorized";

import { hasModulePermission } from "./utiles/adminPermissions";


// Vendor

const ProtectedAdminRoute = ({ moduleKey, children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return null;
  }

  if (!hasModulePermission(moduleKey)) {
    return <Unauthorized />;
  }

  return children;
};


const AppWrapper = () => {
  useLocation();

  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-center" autoClose={2500} />

      <Routes>


        {/* Admin Login */}
        <Route path="/" element={<MainLogin />} />

        {/* Admin Panel */}
        <Route path="/admin/*" element={<MainLayout />}>
          <Route path="dashboard" element={<ProtectedAdminRoute moduleKey="dashboard"><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="house-owners" element={<ProtectedAdminRoute moduleKey="house_owners"><HouseOwners /></ProtectedAdminRoute>} />
          <Route path="staffManagement/:ownerId" element={<ProtectedAdminRoute moduleKey="house_owners"><StaffManagement /></ProtectedAdminRoute>} />
          <Route path="allStaff" element={<ProtectedAdminRoute moduleKey="staff"><AllStaff /></ProtectedAdminRoute>} />

          <Route path="attendanceManagement" element={<ProtectedAdminRoute moduleKey="staff"><AttendanceManagement /></ProtectedAdminRoute>} />
          <Route path="kyc" element={<ProtectedAdminRoute moduleKey="staff"><AadhaarKyc /></ProtectedAdminRoute>} />
          <Route path="jobs" element={<ProtectedAdminRoute moduleKey="jobs"><JobPostings /></ProtectedAdminRoute>} />
          <Route path="leaves" element={<ProtectedAdminRoute moduleKey="staff"><LeaveManagement /></ProtectedAdminRoute>} />
          <Route path="membership" element={<ProtectedAdminRoute moduleKey="membership"><Membership /></ProtectedAdminRoute>} />
          <Route path="salary" element={<ProtectedAdminRoute moduleKey="staff"><SalaryManagement /></ProtectedAdminRoute>} />
          <Route path="notifications" element={<ProtectedAdminRoute moduleKey="dashboard"><Notifications /></ProtectedAdminRoute>} />
          <Route path="addrole" element={<ProtectedAdminRoute moduleKey="roles"><Addrole /></ProtectedAdminRoute>} />
          <Route path="reports" element={<ProtectedAdminRoute moduleKey="reports"><Reports /></ProtectedAdminRoute>} />
          <Route path="blacklist" element={<ProtectedAdminRoute moduleKey="blacklist"><BlacklistManagement /></ProtectedAdminRoute>} />
          <Route path="admin-users" element={<ProtectedAdminRoute moduleKey="sub_admins"><AdminUsers /></ProtectedAdminRoute>} />
          <Route path="settings" element={<ProtectedAdminRoute moduleKey="settings"><Settings /></ProtectedAdminRoute>} />
          <Route path="legal-consents" element={<ProtectedAdminRoute moduleKey="settings"><LegalConsentLogs /></ProtectedAdminRoute>} />
          <Route path="training-videos" element={<ProtectedAdminRoute moduleKey="settings"><TrainingVideoManagement /></ProtectedAdminRoute>} />



        </Route>

      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
