import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../utiles/axiosInstance';

const initialFilters = {
  name: '',
  month: '',
  status: '',
};

const ACTIVE_PAYOUT_STATUSES = ['initiated', 'queued', 'pending', 'processing', 'processed', 'sent'];

const SalaryManagement = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutingId, setPayoutingId] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);

  const salaries = useMemo(() => pageData?.data || [], [pageData]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.name) params.set('name', filters.name);
      if (filters.month) params.set('month', filters.month);
      if (filters.status) params.set('status', filters.status);

      const response = await axiosInstance.get(`/admin/salary${params.toString() ? `?${params.toString()}` : ''}`);
      setPageData(response.data?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load salaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLatestPayout = (salary) => {
    const payouts = salary?.payouts || [];
    return Array.isArray(payouts) && payouts.length ? payouts[0] : null;
  };

  const getStaffBankAccount = (salary) => {
    const bankAccounts = salary?.staff?.bank_accounts || salary?.staff?.bankAccounts || [];
    if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) return null;
    return bankAccounts.find((account) => Number(account.is_set) === 1) || bankAccounts[0];
  };

  const maskAccountNumber = (value) => {
    const text = String(value || '');
    if (text.length <= 4) return text;
    return `${'*'.repeat(Math.max(0, text.length - 4))}${text.slice(-4)}`;
  };

  const handlePayout = async (salary) => {
    const bankAccount = getStaffBankAccount(salary);

    if (!bankAccount) {
      toast.error('Staff bank account not found. Please add or set one first.');
      return;
    }

    if ((salary?.status || '').toLowerCase() !== 'paid') {
      toast.error('Salary must be marked as paid first.');
      return;
    }

    const confirmText = `Send ₹${Number(salary?.net_salary || 0).toFixed(2)} to ${salary?.staff?.name || 'staff'}?`;
    if (!window.confirm(confirmText)) return;

    setPayoutingId(salary.id);
    try {
      const response = await axiosInstance.post(`/admin/salary/${salary.id}/payout`, {
        bank_account_id: bankAccount.id,
        mode: 'bank_transfer',
        purpose: 'salary',
      });

      toast.success(response.data?.message || 'RazorpayX payout initiated.');
      await fetchSalaries();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Payout request failed.');
    } finally {
      setPayoutingId(null);
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
          white-space: nowrap;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Salary Management</h2>
          <div className="text-muted small">RazorpayX payout flow for staff bank transfers</div>
        </div>
        <button className="btn sahayya-btn-primary" onClick={fetchSalaries} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="card sahayya-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-search" style={{ opacity: 0.5 }}></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search staff..."
                value={filters.name}
                onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
          <div className="col-md-3">
            <input
              type="month"
              className="form-control"
              value={filters.month}
              onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={fetchSalaries}>
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="card sahayya-card p-4">
        <div className="table-responsive">
          <table className="table sahayya-table align-middle">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>House Owner</th>
                <th>Staff</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Payment Date</th>
                <th>Salary Status</th>
                <th>RazorpayX</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    Loading salaries...
                  </td>
                </tr>
              ) : salaries.length ? (
                salaries.map((salary, index) => {
                  const latestPayout = getLatestPayout(salary);
                  const bankAccount = getStaffBankAccount(salary);
                  const payoutStatus = latestPayout?.status || 'not initiated';
                  const canPayout = (salary?.status || '').toLowerCase() === 'paid' && !ACTIVE_PAYOUT_STATUSES.includes(String(payoutStatus).toLowerCase());

                  return (
                    <tr key={salary.id}>
                      <td>{((pageData?.current_page || 1) - 1) * (pageData?.per_page || 10) + index + 1}</td>
                      <td>{salary?.houseowner?.name || salary?.houseowner?.first_name || 'N/A'}</td>
                      <td>
                        <div className="fw-bold">
                          {salary?.staff
                            ? ((salary.staff.first_name || salary.staff.last_name)
                                ? `${salary.staff.first_name || ""} ${salary.staff.last_name || ""}`.trim()
                                : (salary.staff.name || `Staff #${salary.staff_id}`))
                            : `Staff #${salary.staff_id}`}
                        </div>
                        <small className="text-muted">ID: {salary?.staff_id}</small>
                      </td>
                      <td>{salary?.payment_date || '-'}</td>
                      <td className="fw-bold">INR {Number(salary?.net_salary || 0).toFixed(2)}</td>
                      <td>{salary?.payment_mode || '-'}</td>
                      <td>{salary?.payment_date || '-'}</td>
                      <td>
                        <span className={`badge rounded-pill ${String(salary?.status).toLowerCase() === 'paid' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {salary?.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold">{payoutStatus}</div>
                          <div className="text-muted">
                            {bankAccount ? `${bankAccount.bank_name} • ${maskAccountNumber(bankAccount.account_number)}` : 'No bank account'}
                          </div>
                        </div>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => setSelectedSalary(salary)}
                        >
                          Details
                        </button>
                        <button
                          className="btn btn-sm sahayya-btn-primary"
                          disabled={!canPayout || payoutingId === salary.id}
                          onClick={() => handlePayout(salary)}
                        >
                          {payoutingId === salary.id ? 'Sending...' : 'Send RazorpayX'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    No salary records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
          <span className="text-muted small">
            Showing {pageData?.from || 0} to {pageData?.to || 0} of {pageData?.total || 0} records
          </span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pageData?.prev_page_url ? '' : 'disabled'}`}>
                <button className="page-link" onClick={fetchSalaries} disabled={!pageData?.prev_page_url}>
                  Reload
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {selectedSalary && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.45)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0" style={{ borderRadius: '15px' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Salary Details</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedSalary(null)}></button>
              </div>
              <div className="modal-body px-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <div className="small text-muted mb-1">Staff</div>
                      <div className="fw-semibold">{selectedSalary?.staff?.name || 'N/A'}</div>
                      <div className="small text-muted">Phone: {selectedSalary?.staff?.phone_number || 'N/A'}</div>
                      <div className="small text-muted">Bank: {getStaffBankAccount(selectedSalary)?.bank_name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <div className="small text-muted mb-1">Salary</div>
                      <div className="fw-semibold">₹{Number(selectedSalary?.net_salary || 0).toFixed(2)}</div>
                      <div className="small text-muted">Status: {selectedSalary?.status || 'pending'}</div>
                      <div className="small text-muted">Payment date: {selectedSalary?.payment_date || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="fw-semibold mb-2">Recent payout attempts</div>
                  {(selectedSalary?.payouts || []).length ? (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Reference</th>
                            <th>UTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSalary.payouts.map((payout) => (
                            <tr key={payout.id}>
                              <td>{payout.status}</td>
                              <td>₹{Number(payout.amount || 0).toFixed(2)}</td>
                              <td>{payout.reference_id || '-'}</td>
                              <td>{payout.utr || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-muted small">No payout attempts yet.</div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light" onClick={() => setSelectedSalary(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
