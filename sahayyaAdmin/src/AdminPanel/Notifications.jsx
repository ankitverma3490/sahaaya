import React, { useEffect, useState } from 'react';
import axiosInstance from '../utiles/axiosInstance';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Send Notification Form State
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'push',
    audience: 'all_users'
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch notifications log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!sendForm.title || !sendForm.message) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSending(true);
      const res = await axiosInstance.post('/admin/notifications/send', sendForm);
      if (res.data.success) {
        toast.success(res.data.message || 'Notification Sent');
        setSendForm({ title: '', message: '', type: 'push', audience: 'all_users' });
        const modal = window.bootstrap?.Modal?.getInstance(document.getElementById("sendNotificationModal"));
        modal?.hide();
      }
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'text-danger fw-bold';
      case 'Medium': return 'text-warning fw-bold';
      case 'Low': return 'text-info fw-bold';
      default: return 'text-secondary fw-bold';
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
        <div>
          <h2 className="fw-bold mb-0">Notifications Center</h2>
          <p className="text-muted small">Send communications and view notification logs</p>
        </div>
        <div>
          <button className="btn sahayya-btn-primary px-4 me-2" data-bs-toggle="modal" data-bs-target="#sendNotificationModal">
            <i className="bi bi-send me-2"></i>Send Message
          </button>
          <button className="btn btn-outline-secondary px-3" onClick={fetchNotifications}>
            <i className="bi bi-arrow-repeat"></i>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="card sahayya-card p-4">
        
        <h5 className="mb-4 fw-bold border-bottom pb-2">Recent Logs</h5>

        {/* Read-Only Table */}
        <div className="table-responsive">
          <table className="table sahayya-table align-middle">
            <thead>
              <tr>
                <th>Message</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading logs...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-muted">No notifications in log.</td></tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif.id}>
                    <td className="w-50">
                      <div className="fw-semibold text-dark">{notif.message}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{notif.type}</span>
                    </td>
                    <td className="text-muted small">
                      {notif.date}
                    </td>
                    <td>
                      <i className={`bi bi-circle-fill me-2 small ${getPriorityClass(notif.priority)}`}></i>
                      {notif.priority}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Notification Modal */}
      <div className="modal fade" id="sendNotificationModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0" style={{ borderRadius: '15px' }}>
            <div className="modal-header">
              <h5 className="modal-title fw-bold">Compose Message</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleSendNotification}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Target Audience</label>
                  <select 
                    className="form-select" 
                    value={sendForm.audience}
                    onChange={(e) => setSendForm({...sendForm, audience: e.target.value})}
                  >
                    <option value="all_users">All App Users (Home Owners & Staff)</option>
                    <option value="home_owners">Only Home Owners</option>
                    <option value="staff">Only Staff</option>
                    <option value="paid_members">Paid Members Only</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Communication Type</label>
                  <select 
                    className="form-select"
                    value={sendForm.type}
                    onChange={(e) => setSendForm({...sendForm, type: e.target.value})}
                  >
                    <option value="push">Push Notification</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="promotional">Promotional SMS</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Happy Diwali Offer!" 
                    value={sendForm.title}
                    onChange={(e) => setSendForm({...sendForm, title: e.target.value})}
                    maxLength="50"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message Content</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Type your message here..."
                    value={sendForm.message}
                    onChange={(e) => setSendForm({...sendForm, message: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-0 bg-light rounded-bottom">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn sahayya-btn-primary px-4" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Notifications;