import React, { useEffect, useState } from 'react';
import axiosInstance from '../utiles/axiosInstance';
import { toast } from 'react-toastify';

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/leave-list');
      if (res.data?.status || res.data?.success) {
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setLeaveRequests(data);
      }
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this leave request?')) return;
    try {
      setActionLoadingId(id);
      const res = await axiosInstance.post(`/leave-approve/${id}`);
      if (res.data?.status || res.data?.success) {
        toast.success(res.data?.message || 'Leave approved successfully');
        fetchLeaveRequests();
      } else {
        toast.error(res.data?.message || 'Failed to approve leave');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to approve leave');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this leave request?')) return;
    try {
      setActionLoadingId(id);
      const res = await axiosInstance.post(`/leave-reject/${id}`);
      if (res.data?.status || res.data?.success) {
        toast.success(res.data?.message || 'Leave rejected successfully');
        fetchLeaveRequests();
      } else {
        toast.error(res.data?.message || 'Failed to reject leave');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reject leave');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStaffName = (leave) => {
    const u = leave?.user;
    return `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.name || `Staff #${leave?.created_by || leave?.user_id || 'N/A'}`;
  };

  const getHouseOwnerName = (leave) => {
    const ho = leave?.houseowner || leave?.job?.user || leave?.job?.creator;
    return `${ho?.first_name || ''} ${ho?.last_name || ''}`.trim() || ho?.name || `Owner #${leave?.houseowner_id || 'N/A'}`;
  };

  const filteredLeaves = leaveRequests.filter((leave) => {
    const staffName = getStaffName(leave).toLowerCase();
    const ownerName = getHouseOwnerName(leave).toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = !search || staffName.includes(query) || ownerName.includes(query);

    const leaveStatus = String(leave?.status || 'Pending').toLowerCase();
    const matchesStatus =
      statusFilter === 'All' ||
      leaveStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
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
          <h2 className="fw-bold mb-0">Leave Management</h2>
          <small className="text-muted">Review and manage staff leave requests</small>
        </div>
        <button className="btn sahayya-btn-primary px-4" onClick={fetchLeaveRequests} disabled={loading}>
          <i className="bi bi-arrow-repeat me-2"></i>{loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="card sahayya-card p-4">
        {/* Search + Filter */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Search by staff or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table sahayya-table align-middle">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Staff</th>
                <th>House Owner</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    Loading leave requests...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave, index) => {
                  const status = String(leave.status || 'Pending').toLowerCase();
                  return (
                    <tr key={leave.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="fw-bold">{getStaffName(leave)}</div>
                        <small className="text-muted">{leave?.leave_type?.name || leave?.job?.title || 'Staff'}</small>
                      </td>
                      <td className="fw-semibold">{getHouseOwnerName(leave)}</td>
                      <td>{leave?.leave_type?.name || 'General Leave'}</td>
                      <td>{leave.from_date || leave.from || '-'}</td>
                      <td>{leave.to_date || leave.to || '-'}</td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={leave.reason}>
                          {leave.reason || '-'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            status === 'approved'
                              ? 'bg-success-subtle text-success'
                              : status === 'pending'
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-danger-subtle text-danger'
                          }`}
                        >
                          {leave.status || 'Pending'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#viewLeaveModal"
                          onClick={() => setSelectedLeave(leave)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              disabled={actionLoadingId === leave.id}
                              onClick={() => handleApprove(leave.id)}
                              title="Approve Leave"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={actionLoadingId === leave.id}
                              onClick={() => handleReject(leave.id)}
                              title="Reject Leave"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Total: {filteredLeaves.length} requests</small>
        </div>
      </div>

      {/* Modal */}
      <div className="modal fade" id="viewLeaveModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4">
            <div className="modal-header border-0">
              <h5 className="fw-bold">Leave Request Details</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            {selectedLeave && (
              <div className="modal-body">
                <div className="bg-light rounded p-3 mb-3">
                  <p className="mb-1"><strong>Staff:</strong> {getStaffName(selectedLeave)}</p>
                  <p className="mb-1"><strong>House Owner:</strong> {getHouseOwnerName(selectedLeave)}</p>
                  <p className="mb-1"><strong>Duration:</strong> {selectedLeave.from_date || selectedLeave.from} to {selectedLeave.to_date || selectedLeave.to}</p>
                  <p className="mb-0"><strong>Status:</strong> {selectedLeave.status || 'Pending'}</p>
                </div>
                <label className="small fw-bold">Reason</label>
                <p className="border rounded p-2 bg-white">{selectedLeave.reason || 'No reason provided.'}</p>
              </div>
            )}
            <div className="modal-footer border-0">
              <button className="btn btn-light" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
