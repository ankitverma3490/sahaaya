import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";

const BlacklistManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBlacklists = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/admin/blacklists");
      setRecords(response?.data?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load blacklist records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlacklists();
  }, []);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Blacklist Management</h2>
          <small className="text-muted">Track staff terminations marked as blacklist cases.</small>
        </div>
        <button className="btn btn-outline-success" onClick={loadBlacklists}>
          Refresh
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {loading ? (
            <div className="text-muted">Loading blacklist records...</div>
          ) : records.length === 0 ? (
            <div className="text-muted">No blacklist cases found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Termination Date</th>
                    <th>Police Station</th>
                    <th>Reported By</th>
                    <th>FIR</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="fw-semibold">{record?.user?.name || "Unknown Staff"}</div>
                        <small className="text-muted">{record?.user?.phone_number || "No phone"}</small>
                      </td>
                      <td>
                        <div>{record.reason}</div>
                        <small className="text-muted">{record.remarks || "No remarks"}</small>
                      </td>
                      <td>
                        <span className="badge bg-danger-subtle text-danger">
                          {record.status || "pending"}
                        </span>
                      </td>
                      <td>{record.termination_date || "-"}</td>
                      <td>
                        <div>{record.police_station_name || "-"}</div>
                        <small className="text-muted">{record.police_station_contact || ""}</small>
                      </td>
                      <td>{record?.reporter?.name || "-"}</td>
                      <td>
                        {record.fir_photo ? (
                          <a href={record.fir_photo} target="_blank" rel="noreferrer">
                            View FIR
                          </a>
                        ) : (
                          <span className="text-muted">Not uploaded</span>
                        )}
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
  );
};

export default BlacklistManagement;
