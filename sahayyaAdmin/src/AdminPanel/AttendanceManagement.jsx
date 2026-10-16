import React, { useEffect, useState } from 'react';
import axiosInstance from '../utiles/axiosInstance';
import { toast } from 'react-toastify';

const AttendanceManagement = () => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set('start_date', selectedDate);
      if (selectedDate) params.set('end_date', selectedDate);
      if (statusFilter) params.set('status', statusFilter);

      const res = await axiosInstance.get(`/admin/housersold/attendance${params.toString() ? `?${params.toString()}` : ''}`);
      if (res.data?.status || res.data?.success) {
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setAttendanceList(data);
        if (data.length > 0 && !selectedRecord) {
          setSelectedRecord(data[0]);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, statusFilter]);

  const presentCount = attendanceList.filter((a) => a.status === 'present').length;
  const absentCount = attendanceList.filter((a) => a.status === 'absent').length;
  const lateCount = attendanceList.filter((a) => a.status === 'late' || a.status === 'leave').length;
  const totalCount = attendanceList.length;

  const summaryCards = [
    { title: "Total Marked", value: totalCount, color: "#D98C7A" },
    { title: "Present Today", value: presentCount, color: "#198754" },
    { title: "Absent", value: absentCount, color: "#dc3545" },
    { title: "Late / Leave", value: lateCount, color: "#ffc107" },
  ];

  const getStaffName = (rec) => {
    const s = rec?.staff || rec?.user;
    return `${s?.first_name || ''} ${s?.last_name || ''}`.trim() || s?.name || `Staff #${rec?.staff_id || 'N/A'}`;
  };

  const filteredAttendance = attendanceList.filter((rec) => {
    if (!search.trim()) return true;
    const name = getStaffName(rec).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="container-fluid p-4" style={{ minHeight: '100vh' }}>
      <style>{`
        .sahayya-btn-primary {
          background-color: #D98C7A !important;
          border-color: #D98C7A !important;
          color: white !important;
        }
        .sahayya-btn-primary:hover {
          background-color: #c47b6a !important;
          border-color: #c47b6a !important;
        }
        .sahayya-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .sahayya-table thead th {
          background-color: #f8f9fa;
          color: #555;
          font-weight: 600;
          border-bottom: 2px solid #eee;
        }
      `}</style>

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Attendance Management</h2>
          <small className="text-muted">Live attendance tracking and daily logs</small>
        </div>
        <button className="btn sahayya-btn-primary px-4" onClick={fetchAttendance} disabled={loading}>
          <i className="bi bi-arrow-repeat me-2"></i>{loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="row g-3 mb-4">
        {summaryCards.map((card, idx) => (
          <div className="col-md-3" key={idx}>
            <div className="card sahayya-card p-3 border-start border-4" style={{ borderColor: card.color }}>
              <p className="text-muted mb-1 small">{card.title}</p>
              <h4 className="fw-bold mb-0">{card.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Card */}
      <div className="card sahayya-card p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-bold">Select Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-bold">Status Filter</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold">Staff Search</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-person"></i></span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search staff name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setStatusFilter('');
                setSearch('');
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        {/* Attendance Table */}
        <div className="col-md-8">
          <div className="card sahayya-card p-4 h-100">
            <h5 className="fw-bold mb-3">Attendance Records ({selectedDate})</h5>
            <div className="table-responsive">
              <table className="table sahayya-table align-middle">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Staff</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Loading attendance...
                      </td>
                    </tr>
                  ) : filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No attendance marked for this date.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((rec, index) => {
                      const status = String(rec.status || '').toLowerCase();
                      return (
                        <tr
                          key={rec.id}
                          className={selectedRecord?.id === rec.id ? 'table-active' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedRecord(rec)}
                        >
                          <td>{index + 1}</td>
                          <td>
                            <strong>{getStaffName(rec)}</strong>
                            <br />
                            <small className="text-muted">ID: {rec.staff_id}</small>
                          </td>
                          <td>{rec.date}</td>
                          <td>{rec.check_in_time || '-'}</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                status === 'present'
                                  ? 'bg-success-subtle text-success'
                                  : status === 'absent'
                                  ? 'bg-danger-subtle text-danger'
                                  : 'bg-warning-subtle text-warning'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(rec);
                              }}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Staff Details Card */}
        <div className="col-md-4">
          <div className="card sahayya-card p-4 h-100">
            <h5 className="fw-bold mb-4">Selected Record</h5>
            {selectedRecord ? (
              <>
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle border d-inline-flex align-items-center justify-content-center bg-light mb-2"
                    style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                  >
                    👤
                  </div>
                  <h6 className="fw-bold mb-0">{getStaffName(selectedRecord)}</h6>
                  <small className="text-muted">Staff ID: {selectedRecord.staff_id}</small>
                </div>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Date</span>
                    <span className="small fw-bold">{selectedRecord.date}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Status</span>
                    <span className="small fw-bold text-capitalize">{selectedRecord.status}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Check-in</span>
                    <span className="small fw-bold">{selectedRecord.check_in_time || '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Late Minutes</span>
                    <span className="small fw-bold">{selectedRecord.late_minutes || 0} mins</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="small text-muted">Description</span>
                    <span className="small fw-bold">{selectedRecord.description || '-'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-muted">
                Select an attendance record to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;