import React from 'react';

const LeaveManagement = () => {
  const leaveRequests = [
    { 
      id: 1, 
      staff: "Raju Prasad", 
      role: "Driver", 
      houseOwner: "Amitabh Bachchan",
      from: "2026-01-25", 
      to: "2026-01-27", 
      reason: "Family Function", 
      status: "Pending" 
    },
    { 
      id: 2, 
      staff: "Sunita Bai", 
      role: "Cook", 
      houseOwner: "Deepika Padukone",
      from: "2026-02-01", 
      to: "2026-02-05", 
      reason: "Personal Work", 
      status: "Approved" 
    },
    { 
      id: 3, 
      staff: "Manoj Singh", 
      role: "Security", 
      houseOwner: "Ranbir Kapoor",
      from: "2026-01-22", 
      to: "2026-01-22", 
      reason: "Sick Leave", 
      status: "Rejected" 
    },
  ];

  return (
    <div className="container-fluid p-4" style={{ minHeight: '100vh' }}>

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Leave Management</h2>
        <button className="btn sahayya-btn-primary px-4">
          <i className="bi bi-calendar-check me-2"></i>Leave Policy
        </button>
      </div>

      <div className="card sahayya-card p-4">

        {/* Search + Filter */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search by staff name..." />
          </div>
          <div className="col-md-2">
            <select className="form-select">
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table sahayya-table align-middle">
            <thead>
              <tr>
                <th>Staff</th>
                <th>House Owner</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((leave) => (
                <tr key={leave.id}>
                  <td>
                    <div className="fw-bold">{leave.staff}</div>
                    <small className="text-muted">{leave.role}</small>
                  </td>
                  <td className="fw-semibold">{leave.houseOwner}</td>
                  <td>{leave.from}</td>
                  <td>{leave.to}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <span className={`badge rounded-pill ${
                      leave.status === 'Approved' ? 'bg-success-subtle text-success' :
                      leave.status === 'Pending' ? 'bg-warning-subtle text-warning' :
                      'bg-danger-subtle text-danger'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#viewLeaveModal">
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-success me-2">
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button className="btn btn-sm btn-danger">
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span className="text-muted small">Showing 1 to 3 of 3 requests</span>
          <ul className="pagination pagination-sm mb-0">
            <li className="page-item active">
              <span className="page-link" style={{backgroundColor:'#D98C7A',borderColor:'#D98C7A'}}>1</span>
            </li>
          </ul>
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
            <div className="modal-body">
              <div className="bg-light rounded p-3 mb-3">
                <p className="mb-1"><strong>Staff:</strong> Raju Prasad (Driver)</p>
                <p className="mb-1"><strong>House Owner:</strong> Amitabh Bachchan</p>
                <p className="mb-1"><strong>Duration:</strong> Jan 25 – Jan 27, 2026</p>
                <p className="mb-0"><strong>Total Days:</strong> 3 Days</p>
              </div>
              <label className="small fw-bold">Reason</label>
              <p className="border rounded p-2 bg-white">
                Family function in village.
              </p>
              <label className="small fw-bold">Admin Remarks</label>
              <textarea className="form-control" placeholder="Optional remarks"></textarea>
            </div>
            <div className="modal-footer border-0">
              <button className="btn btn-outline-danger me-auto">Reject</button>
              <button className="btn btn-light" data-bs-dismiss="modal">Close</button>
              <button className="btn sahayya-btn-primary">Approve</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LeaveManagement;
