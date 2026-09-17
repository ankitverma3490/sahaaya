import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const C = {
  primary: "#D98579",
  accent: "#E8A99E",
  bg: "#f4f6f9",
  white: "#ffffff",
  border: "#e8edf2",
  textMain: "#1a1a2e",
  textSub: "#6b7280",
  textLight: "#9ca3af",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-";

const LegalConsentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalData, setModalData] = useState(null);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: 50 };
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await axiosInstance.get("/admin/legal-consents", { params });
      if (res?.data?.success) {
        setLogs(res.data.data.data || []);
        setPagination(res.data.data);
      } else {
        setLogs([]);
        setPagination(null);
        toast.error(res?.data?.message || "Failed to load consent logs");
      }
    } catch (error) {
      console.log(error);
      setLogs([]);
      setPagination(null);
      toast.error(error?.response?.data?.message || "Failed to load consent logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs(1);
  };

  const handleReset = () => {
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    fetchLogs(1);
  };

  return (
    <div style={{ padding: "28px", background: C.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.primary, margin: 0, letterSpacing: -0.3 }}>
          Legal Consent Logs
        </h1>
        <p style={{ fontSize: 12, color: C.textSub, margin: "3px 0 0" }}>
          Record of all privacy policy and disclaimer acceptances by users
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "flex-end" }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 4 }}>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="">All Types</option>
            <option value="privacy_policy">Privacy Policy</option>
            <option value="disclaimer">Disclaimer</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 4 }}>From Date</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={filterInputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 4 }}>To Date</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={filterInputStyle} />
        </div>
        <button onClick={handleSearch} style={btnPrimary}>Search</button>
        <button onClick={handleReset} style={btnSecondary}>Reset</button>
      </div>

      {/* Stats */}
      {pagination && (
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12 }}>
          Total Records: <strong style={{ color: C.primary }}>{pagination.total}</strong>
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg, textAlign: "left" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Accepted At</th>
              <th style={thStyle}>IP Address</th>
              <th style={thStyle}>Consent Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: C.textSub }}>Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: C.textSub }}>No consent records found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>{log.id}</td>
                  <td style={tdStyle}>{log.user?.name || (log.user?.first_name ? `${log.user.first_name} ${log.user.last_name || ''}`.trim() : null) || "Unknown"}</td>
                  <td style={tdStyle}>{log.phone_number || log.user?.phone || log.user?.phone_number || "-"}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: log.type === "privacy_policy" ? "#e8f5e9" : "#fff3e0",
                      color: log.type === "privacy_policy" ? "#2e7d32" : "#e65100",
                    }}>
                      {log.type === "privacy_policy" ? "Privacy Policy" : "Disclaimer"}
                    </span>
                  </td>
                  <td style={tdStyle}>{fmtDate(log.accepted_at)}</td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{log.ip_address || "-"}</td>
                  <td style={tdStyle}>
                    {log.consent_data ? (
                      <span
                        style={{ color: C.accent, cursor: "pointer", textDecoration: "underline", fontSize: 12 }}
                        onClick={() => setModalData(log.consent_data)}
                      >
                        View
                      </span>
                    ) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1px solid ${p === page ? C.primary : C.border}`,
                background: p === page ? C.primary : C.white,
                color: p === page ? C.white : C.textMain,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Custom Modal for Consent Data */}
      {modalData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={() => setModalData(null)}>
          <div style={{ background: "#fff", padding: 28, borderRadius: 16, minWidth: 360, maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✅</div>
              <div>
                <h3 style={{ margin: 0, color: C.primary, fontSize: 16, fontWeight: 700 }}>Consent Confirmed</h3>
                <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>User acceptance details</p>
              </div>
            </div>
            <div style={{ background: C.bg, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
              {Object.entries(modalData).map(([key, value]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.textSub, textTransform: "capitalize", fontWeight: 500 }}>
                    {key.replace(/_/g, " ")}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: value === true ? "#2e7d32" : value === false ? "#c62828" : C.textMain,
                    background: value === true ? "#e8f5e9" : value === false ? "#ffebee" : "transparent",
                    padding: value === true || value === false ? "2px 10px" : "0",
                    borderRadius: 8,
                  }}>
                    {value === true ? "✓ Yes" : value === false ? "✗ No" : String(value)}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setModalData(null)} style={{ ...btnPrimary, marginTop: 18, width: "100%", padding: "10px 0", fontSize: 14 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const filterSelectStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  fontSize: 13,
  minWidth: 160,
  background: C.white,
};

const filterInputStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  fontSize: 13,
  minWidth: 150,
  background: C.white,
};

const btnPrimary = {
  padding: "8px 20px",
  borderRadius: 8,
  border: "none",
  background: C.primary,
  color: C.white,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const btnSecondary = {
  padding: "8px 20px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.white,
  color: C.textMain,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const thStyle = {
  padding: "12px 14px",
  fontWeight: 700,
  color: C.textSub,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  borderBottom: `2px solid ${C.border}`,
};

const tdStyle = {
  padding: "10px 14px",
  color: C.textMain,
  verticalAlign: "middle",
};

export default LegalConsentLogs;
