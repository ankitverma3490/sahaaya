import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const SubscriptionHistory = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [owners, setOwners] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // ================= FETCH SUBSCRIPTIONS =================
  const fetchSubscriptions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/admin/subscriptionuser/history?page=${page}&per_page=15`
      );

      if (res.data.status) {
        setSubscriptions(res.data.subscriptions?.data || []);
        setPagination({
          current_page: res.data.subscriptions?.current_page || page,
          last_page: res.data.subscriptions?.last_page || 1,
          total: res.data.subscriptions?.total || 0,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


  // ================= FETCH OWNERS =================
  const fetchOwners = async () => {
    try {
      const res = await axiosInstance.get("/admin/houseowners");
      if (res.data.success) {
        setOwners(res.data.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= FETCH ALL STAFF =================
  const fetchAllStaff = async () => {
    try {
      const res = await axiosInstance.get("/admin/stafflist");

      if (res.data.success) {
        setStaffs(res.data.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchOwners();
    fetchAllStaff();
  }, []);

  // ================= OWNER MAP =================
  const ownerMap = useMemo(() => {
    const map = {};
    owners.forEach((o) => {
      const fullName = `${o.first_name || ""} ${o.last_name || ""}`.trim();
      map[o.id] = fullName || o.name || o.email || "";
    });
    return map;
  }, [owners]);

  // ================= STAFF MAP =================
  const staffMap = useMemo(() => {
    const map = {};
    staffs.forEach((s) => {
      const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
      map[s.id] = fullName || s.name || s.email || "";
    });
    return map;
  }, [staffs]);

  // ================= GET USER NAME =================
  const getUserName = (sub) => {
    const userId = sub?.user_id;
    const role = String(sub?.role ?? "");

    const fullName = `${sub?.user?.first_name || ""} ${sub?.user?.last_name || ""}`.trim();
    if (fullName) return fullName;
    if (sub?.user?.name) return sub.user.name;
    if (sub?.user?.email) return sub.user.email;

    if (role === "3") {
      return ownerMap[userId] || "Unknown Owner";
    }

    if (role === "2") {
      return staffMap[userId] || "Unknown Staff";
    }

    if (ownerMap[userId]) return ownerMap[userId];
    if (staffMap[userId]) return staffMap[userId];

    return sub?.user_id ? `User #${sub.user_id}` : "User";
  };

  const getEffectiveAmount = (sub) => {
    const storedAmount = Number(sub?.amount || 0);
    if (storedAmount > 0) return storedAmount;

    const paymentMode = String(sub?.payment_mode || "").toLowerCase();
    const paymentStatus = String(sub?.payment_status || "").toLowerCase();
    const isPaidSubscription =
      paymentMode === "razorpay" ||
      paymentStatus === "paid" ||
      paymentStatus === "completed";

    return isPaidSubscription ? Number(sub?.subscription?.price || 0) : 0;
  };

  return (
    <div className="subscription-history-card mt-4">
      <h3 className="fw-bold mb-4" style={{ color: "#1a1a1a" }}>Subscription History</h3>

      <div className="table-responsive">
        <table className="table premium-table align-middle">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Base</th>
              <th>GST</th>
              <th>Total</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-5">
                  <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
                  Loading history...
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-5">
                  <p className="text-muted m-0">No subscription history found</p>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="user-name">
                    {getUserName(sub)}
                  </td>

                  <td>
                    <span className="fw-semibold text-dark">
                      {sub.subscription?.subscription_name}
                    </span>
                  </td>

                  <td className="text-muted">&#8377;{Number(sub.base_amount || 0).toFixed(2)}</td>
                  <td className="text-muted">&#8377;{Number(sub.gst_amount || 0).toFixed(2)}</td>
                  <td className="fw-bold text-success">&#8377;{Number(sub.total_amount || sub.amount || 0).toFixed(2)}</td>

                  <td className="text-capitalize">{sub.subscription?.type}</td>

                  <td>
                    {new Date(sub.start_date).toLocaleDateString()}
                  </td>

                  <td>
                    {new Date(sub.end_date).toLocaleDateString()}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${sub.status === "active"
                          ? "status-active"
                          : "status-inactive"
                        }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.last_page > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Total: {pagination.total} records</small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => fetchSubscriptions(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </button>
              </li>
              <li className="page-item disabled">
                <span className="page-link">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
              </li>
              <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => fetchSubscriptions(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default SubscriptionHistory;

