import React from 'react';

const AttendanceManagement = () => {
  // Static Dummy Data for Calendar Grid
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  const summaryCards = [
    { title: "Total Staff", value: "482", color: "#D98C7A" },
    { title: "Present Today", value: "425", color: "#198754" },
    { title: "Absent", value: "32", color: "#dc3545" },
    { title: "On Leave", value: "25", color: "#ffc107" },
  ];

  return (
    <div className="container-fluid p-4" style={{  minHeight: '100vh' }}>
      <style>{`
        .sahayya-btn-primary {
          background-color: #D98C7A !important;
          border-color: #D98C7A !important;
          color: white !important;
        }
        .sahayya-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }
        .calendar-day {
          aspect-ratio: 1 / 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #eee;
          font-size: 0.9rem;
        }
        .calendar-day.active {
          background-color: #FFF5F2;
          border-color: #D98C7A;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 4px;
        }
      `}</style>

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Attendance Management</h2>
        <button className="btn sahayya-btn-primary px-4">
          <i className="bi bi-download me-2"></i>Export Attendance
        </button>
      </div>

      {/* Filter Card */}
      <div className="card sahayya-card p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-bold">Select Month</label>
            <input type="month" className="form-control" defaultValue="2026-01" />
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold">Staff Filter</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-person"></i></span>
              <input type="text" className="form-control border-start-0" placeholder="Search staff name..." />
            </div>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100">Clear</button>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        {/* Calendar Grid View */}
        <div className="col-md-8">
          <div className="card sahayya-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">January 2026</h5>
              <div className="d-flex gap-3 small">
                <span><i className="bi bi-circle-fill text-success me-1"></i> Present</span>
                <span><i className="bi bi-circle-fill text-danger me-1"></i> Absent</span>
              </div>
            </div>
            
            <div className="calendar-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center fw-bold text-muted mb-2 small">{day}</div>
              ))}
              {days.map(day => (
                <div key={day} className={`calendar-day ${day === 22 ? 'active' : ''}`}>
                  <span className={day === 22 ? 'fw-bold' : ''}>{day}</span>
                  <div className="d-flex gap-1">
                    <div className="status-dot bg-success"></div>
                    {day % 5 === 0 && <div className="status-dot bg-danger"></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Details */}
        <div className="col-md-4">
          <div className="card sahayya-card p-4 h-100">
            <h5 className="fw-bold mb-4">Staff Details (Selected)</h5>
            <div className="text-center mb-4">
              <img src="https://i.pravatar.cc/150?u=1" className="rounded-circle border mb-2" width="80" height="80" alt="profile" />
              <h6 className="fw-bold mb-0">Raju Prasad</h6>
              <small className="text-muted">Driver • ID: STF-9921</small>
            </div>
            <div className="border rounded p-3 bg-light">
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Check-in</span>
                <span className="small fw-bold">09:15 AM</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="small text-muted">Check-out</span>
                <span className="small fw-bold">06:45 PM</span>
              </div>
            </div>
            <div className="mt-4">
              <h6 className="small fw-bold text-uppercase text-muted mb-3">Monthly Stats</h6>
              <div className="progress mb-2" style={{ height: '8px' }}>
                <div className="progress-bar bg-success" style={{ width: '90%' }}></div>
              </div>
              <div className="d-flex justify-content-between small">
                <span>Punctuality</span>
                <span className="fw-bold">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="row g-3">
        {summaryCards.map((card, idx) => (
          <div className="col-md-3" key={idx}>
            <div className="card sahayya-card p-3 border-start border-4" style={{ borderColor: card.color }}>
              <p className="text-muted mb-1 small">{card.title}</p>
              <h4 className="fw-bold mb-0">{card.value}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceManagement;