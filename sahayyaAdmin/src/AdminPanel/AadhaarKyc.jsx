import React, { useEffect, useState } from 'react';
import axiosInstance from '../utiles/axiosInstance';
import { toast } from 'react-toastify';

const AadhaarKyc = () => {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKyc, setSelectedKyc] = useState(null);

  const fetchKycList = async (page = 1, status = "all") => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/kyc/list`, {
        params: { page, status }
      });
      if (response.data.success) {
        setKycList(response.data.data.data);
        setPagination(response.data.data);
        setCurrentPage(response.data.data.current_page);
      }
    } catch (error) {
      toast.error("Failed to fetch KYC list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList(1, statusFilter);
  }, [statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axiosInstance.post(`/admin/kyc/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`KYC status updated to ${newStatus}`);
        fetchKycList(currentPage, statusFilter);
        const modal = window.bootstrap?.Modal?.getInstance(document.getElementById("viewKycModal"));
        modal?.hide();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

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
        <h2 className="fw-bold">Aadhaar & KYC Verification</h2>
        <button className="btn sahayya-btn-primary px-4" onClick={() => fetchKycList(currentPage, statusFilter)}>
          <i className="bi bi-arrow-repeat me-2"></i>Refresh List
        </button>
      </div>

      {/* Main Container */}
      <div className="card sahayya-card p-4">
        
        {/* Search + Filter Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <select 
              className="form-select" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table sahayya-table align-middle">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Role</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center">Loading...</td></tr>
              ) : kycList.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No KYC records found.</td></tr>
              ) : (
                kycList.map((kyc) => (
                  <tr key={kyc.id}>
                    <td className="fw-bold">{kyc.user?.name || kyc.user?.first_name || "Unknown"}</td>
                    <td>{kyc.user?.role_id == 3 ? "Staff" : "Home Owner"}</td>
                    <td>{new Date(kyc.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge rounded-pill ${
                        kyc.status === 'approved' ? 'bg-success-subtle text-success' : 
                        kyc.status === 'pending' ? 'bg-warning-subtle text-warning' : 
                        'bg-danger-subtle text-danger'
                      }`}>
                        {String(kyc.status).toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-secondary me-2" 
                        data-bs-toggle="modal" 
                        data-bs-target="#viewKycModal"
                        onClick={() => setSelectedKyc(kyc)}
                      >
                        View Documents
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination?.last_page > 1 && (
          <div className="d-flex justify-content-end mt-4">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                {[...Array(pagination.last_page)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => fetchKycList(i + 1, statusFilter)}
                      style={currentPage === i + 1 ? {backgroundColor: '#D98C7A', borderColor: '#D98C7A', color: 'white'} : {color: '#333'}}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* View KYC Modal UI */}
      <div className="modal fade" id="viewKycModal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0" style={{ borderRadius: '15px' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">KYC Documents Preview</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            {selectedKyc && (
              <div className="modal-body m-3 pt-0">
                <div className="mb-4">
                  <h6>User Details:</h6>
                  <p className="small text-muted mb-1"><strong>Name:</strong> {selectedKyc.user?.name}</p>
                  <p className="small text-muted mb-1"><strong>Email:</strong> {selectedKyc.user?.email || '-'}</p>
                  <p className="small text-muted mb-1"><strong>Phone:</strong> {selectedKyc.user?.phone_number || '-'}</p>
                </div>
                
                <h6 className="mb-3 border-bottom pb-2">Uploaded Documents:</h6>
                <div className="row g-4">
                  {selectedKyc.aadhaar_front_path && (
                    <div className="col-md-6">
                      <div className="border p-2 rounded text-center">
                        <span className="d-block mb-2 text-muted small fw-bold">Aadhaar Front</span>
                        <img src={selectedKyc.aadhaar_front_path} className="img-fluid rounded" alt="Aadhaar Front" style={{maxHeight: '200px', objectFit: 'contain'}} />
                      </div>
                    </div>
                  )}
                  {selectedKyc.aadhaar_back_path && (
                    <div className="col-md-6">
                      <div className="border p-2 rounded text-center">
                        <span className="d-block mb-2 text-muted small fw-bold">Aadhaar Back</span>
                        <img src={selectedKyc.aadhaar_back_path} className="img-fluid rounded" alt="Aadhaar Back" style={{maxHeight: '200px', objectFit: 'contain'}} />
                      </div>
                    </div>
                  )}
                  {selectedKyc.photo_path && (
                    <div className="col-md-6">
                      <div className="border p-2 rounded text-center">
                        <span className="d-block mb-2 text-muted small fw-bold">Profile Photo</span>
                        <img src={selectedKyc.photo_path} className="img-fluid rounded" alt="Photo" style={{maxHeight: '200px', objectFit: 'contain'}} />
                      </div>
                    </div>
                  )}
                  {selectedKyc.police_verification_path && (
                    <div className="col-md-6">
                      <div className="border p-2 rounded text-center h-100 d-flex flex-column justify-content-center">
                        <span className="d-block mb-2 text-muted small fw-bold">Police Verification</span>
                        {selectedKyc.police_verification_path.endsWith('.pdf') ? (
                          <a href={selectedKyc.police_verification_path} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm mx-auto">View PDF Document</a>
                        ) : (
                          <img src={selectedKyc.police_verification_path} className="img-fluid rounded" alt="Police Verification" style={{maxHeight: '200px', objectFit: 'contain'}} />
                        )}
                      </div>
                    </div>
                  )}
                  {(!selectedKyc.aadhaar_front_path && !selectedKyc.aadhaar_back_path && !selectedKyc.photo_path && !selectedKyc.police_verification_path) && (
                    <div className="col-12 text-center text-muted py-4">No documents uploaded.</div>
                  )}
                </div>
              </div>
            )}
            <div className="modal-footer border-0 bg-light rounded-bottom">
              <button 
                type="button" 
                className="btn btn-outline-danger me-auto"
                onClick={() => updateStatus(selectedKyc.id, 'rejected')}
                disabled={selectedKyc?.status === 'rejected'}
              >
                Reject KYC
              </button>
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">Close</button>
              <button 
                type="button" 
                className="btn sahayya-btn-primary"
                onClick={() => updateStatus(selectedKyc.id, 'approved')}
                disabled={selectedKyc?.status === 'approved'}
              >
                Approve Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AadhaarKyc;