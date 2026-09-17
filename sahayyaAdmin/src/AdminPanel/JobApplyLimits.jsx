import React, { useState, useEffect } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";
import { FiSliders, FiDollarSign, FiShoppingBag, FiUsers, FiSearch, FiCheckCircle } from "react-icons/fi";
import "./JobApplyLimits.css";

const JobApplyLimits = () => {
  // Settings state
  const [freeLimit, setFreeLimit] = useState(3);
  const [pricePerSlot, setPricePerSlot] = useState(49);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    total_purchases: 0,
    total_revenue: 0,
    total_slots_granted: 0,
    recent_purchases: [],
    monthly_stats: []
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Staff limit statuses state
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchStats();
    fetchStaffLimits();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchStaffLimits();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get("/admin/job-limit/settings");
      if (res.data.status === "success") {
        setFreeLimit(res.data.data.free_limit);
        setPricePerSlot(res.data.data.price_per_slot);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axiosInstance.get("/admin/job-limit/stats");
      if (res.data.status === "success") {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Staff Limit Statuses
  const fetchStaffLimits = async (pageNum = 1) => {
    setStaffLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/job-limit/staff?page=${pageNum}&search=${search}`);
      if (res.data.status === "success") {
        setStaffList(res.data.data.data || []);
        setPage(res.data.data.current_page || 1);
        setTotalPages(res.data.data.last_page || 1);
      }
    } catch (err) {
      console.error("Failed to fetch staff limits", err);
    } finally {
      setStaffLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await axiosInstance.post("/admin/job-limit/settings", {
        free_limit: Number(freeLimit),
        price_per_slot: Number(pricePerSlot)
      });
      if (res.data.status === "success") {
        toast.success(res.data.message || "Settings updated successfully!");
        fetchStaffLimits(page); // refresh lists with new limits
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="job-limits-container container-fluid p-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Job Application Limits & Payments</h1>
          <p className="text-muted mb-0">Manage staff job application limits, pricing, and track slot purchase history.</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="stats-card purple-gradient shadow-sm border-0 card p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-white-50 text-uppercase mb-2 fw-semibold">Total Revenue</h6>
                <h2 className="text-white fw-bold mb-0">₹{stats.total_revenue}</h2>
              </div>
              <div className="stats-icon bg-white-10 text-white p-3 rounded-circle">
                <FiDollarSign size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stats-card blue-gradient shadow-sm border-0 card p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-white-50 text-uppercase mb-2 fw-semibold">Limit Purchases</h6>
                <h2 className="text-white fw-bold mb-0">{stats.total_purchases} Orders</h2>
              </div>
              <div className="stats-icon bg-white-10 text-white p-3 rounded-circle">
                <FiShoppingBag size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stats-card green-gradient shadow-sm border-0 card p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-white-50 text-uppercase mb-2 fw-semibold">Slots Granted</h6>
                <h2 className="text-white fw-bold mb-0">{stats.total_slots_granted} Slots</h2>
              </div>
              <div className="stats-icon bg-white-10 text-white p-3 rounded-circle">
                <FiCheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-5">
        {/* SETTINGS CARD */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center gap-2">
                <FiSliders className="text-primary" /> Quota & Pricing Configuration
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSaveSettings}>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary">Free Application Limit</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-lg bg-light border-0"
                    value={freeLimit}
                    onChange={(e) => setFreeLimit(e.target.value)}
                    placeholder="e.g. 3"
                    required
                  />
                  <div className="form-text text-muted mt-1">
                    Maximum number of jobs a staff can apply to initially without paying.
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary">Price per Extra Application Slot (INR)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0 fw-semibold text-muted">₹</span>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-lg bg-light border-0"
                      value={pricePerSlot}
                      onChange={(e) => setPricePerSlot(e.target.value)}
                      placeholder="e.g. 49"
                      required
                    />
                  </div>
                  <div className="form-text text-muted mt-1">
                    Cost in INR for staff to unlock one extra application after reaching limit.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mt-2 fw-semibold"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  Save Configuration
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RECENT PURCHASES */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center gap-2">
                <FiShoppingBag className="text-success" /> Recent Payments
              </h5>
            </div>
            <div className="card-body p-0 position-relative">
              {statsLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : stats.recent_purchases.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  No purchases found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle table-hover mb-0">
                    <thead className="table-light text-uppercase fs-7 text-secondary">
                      <tr>
                        <th className="px-4 py-3">Staff</th>
                        <th className="py-3">Payment ID</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Extra Limit</th>
                        <th className="px-4 py-3 text-end">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_purchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td className="px-4 py-3 fw-semibold text-dark">
                            <div>{purchase.user_name}</div>
                            <small className="text-muted d-block">{purchase.user_phone}</small>
                          </td>
                          <td className="py-3 font-monospace text-muted">{purchase.razorpay_payment_id || "N/A"}</td>
                          <td className="py-3 fw-bold text-success">₹{purchase.amount}</td>
                          <td className="py-3">+{purchase.extra_limit_granted} Slot</td>
                          <td className="px-4 py-3 text-end text-muted">
                            {new Date(purchase.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STAFF STATUS TABLE */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3">
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center gap-2">
                <FiUsers className="text-info" /> Staff Application Limit Status
              </h5>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><FiSearch className="text-muted" /></span>
                <input
                  type="text"
                  className="form-control bg-light border-0"
                  placeholder="Search staff by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body p-0 position-relative">
          {staffLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-info" role="status"></div>
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No staff members found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="table-light text-uppercase fs-7 text-secondary">
                  <tr>
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="py-3">Phone</th>
                    <th className="py-3">Free Limit</th>
                    <th className="py-3">Extra Granted</th>
                    <th className="py-3">Total Allowed</th>
                    <th className="py-3">Jobs Applied</th>
                    <th className="py-3">Slots Left</th>
                    <th className="px-4 py-3 text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id}>
                      <td className="px-4 py-3 fw-semibold text-dark">{staff.name}</td>
                      <td className="py-3 text-muted">{staff.phone || "N/A"}</td>
                      <td className="py-3">{freeLimit}</td>
                      <td className="py-3 fw-semibold text-primary">+{staff.extra_limit}</td>
                      <td className="py-3 fw-bold">{staff.total_allowed}</td>
                      <td className="py-3">
                        <span className="badge bg-secondary rounded-pill px-3">{staff.apply_count}</span>
                      </td>
                      <td className="py-3">
                        <span className={`fw-bold ${staff.remaining === 0 ? "text-danger" : "text-success"}`}>
                          {staff.remaining} Slots
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        {staff.limit_exceeded ? (
                          <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill">Exceeded</span>
                        ) : (
                          <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
            <span className="text-muted fs-7">Page {page} of {totalPages}</span>
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => fetchStaffLimits(page - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => fetchStaffLimits(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => fetchStaffLimits(page + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplyLimits;
