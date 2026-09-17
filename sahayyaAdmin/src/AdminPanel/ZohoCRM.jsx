import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const TABS = ["Leads", "Contacts", "Deals", "Pipeline", "Reports"];

const STATUS_COLORS = {
  Contacted: "#17a2b8",
  Qualified: "#28a745",
  Unqualified: "#dc3545",
  "Need Assessment": "#fd7e14",
  "Attempted to Contact": "#6f42c1",
  "Not Contacted": "#6c757d",
  "New": "#007bff",
};

const DEAL_STAGES = [
  "Qualification",
  "Needs Analysis",
  "Value Proposition",
  "Id. Decision Makers",
  "Perception Analysis",
  "Proposal/Price Quote",
  "Negotiation/Review",
  "Closed Won",
  "Closed Lost",
];

const ZohoCRM = () => {
  const [activeTab, setActiveTab] = useState("Leads");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState({ leads: 0, contacts: 0, deals: 0 });
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({});
  const [editRecord, setEditRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pipeline, setPipeline] = useState([]);
  const [pipelineMeta, setPipelineMeta] = useState({ total_deals: 0, total_amount: 0 });
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/crm/summary");
      if (data.success) setSummary(data.data);
    } catch {}
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/leads");
      setLeads(data.data?.data || []);
    } catch (e) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/contacts");
      setContacts(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/deals");
      setDeals(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/reports");
      if (data.success) setReports(data.data);
    } catch {
      toast.error("Failed to fetch reports");
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchPipeline = useCallback(async () => {
    setPipelineLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/deals/pipeline");
      if (data.success) {
        setPipeline(data.data);
        setPipelineMeta(data.meta);
      }
    } catch {
      toast.error("Failed to fetch pipeline");
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  const handleMoveStage = async (dealId, newStage) => {
    try {
      const { data } = await axiosInstance.put(`/zoho/crm/deals/${dealId}/stage`, { stage: newStage });
      if (data.success) {
        toast.success(`Deal moved to ${newStage}`);
        fetchPipeline();
      } else {
        toast.error("Failed to move deal");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to move deal");
    }
  };

  const handleDragStart = (e, deal, fromStage) => {
    setDraggedDeal({ deal, fromStage });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toStage) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.fromStage !== toStage) {
      handleMoveStage(draggedDeal.deal.id, toStage);
    }
    setDraggedDeal(null);
  };

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === "Leads") fetchLeads();
    else if (activeTab === "Contacts") fetchContacts();
    else if (activeTab === "Deals") fetchDeals();
    else if (activeTab === "Pipeline") fetchPipeline();
    else if (activeTab === "Reports") fetchReports();
  }, [activeTab, fetchLeads, fetchContacts, fetchDeals, fetchPipeline, fetchReports]);

  const handleSync = async (type) => {
    setSyncing(true);
    try {
      const endpoint = type === "staff" ? "/zoho/crm/sync/staff" : "/zoho/crm/sync/owners";
      const { data } = await axiosInstance.post(endpoint);
      toast.success(data.message || "Sync completed");
      fetchSummary();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateRecord = async () => {
    try {
      const endpoint = activeTab === "Leads"
        ? "/zoho/crm/leads"
        : activeTab === "Contacts"
          ? "/zoho/crm/contacts"
          : "/zoho/crm/deals";
      const { data } = await axiosInstance.post(endpoint, formData);
      if (data.success) {
        toast.success(`${activeTab.slice(0, -1)} created successfully`);
        setShowForm(false);
        setFormData({});
        refreshTab();
      } else {
        toast.error("Failed to create record");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create record");
    }
  };

  const handleUpdateRecord = async () => {
    if (!editRecord) return;
    try {
      const endpoint = `/zoho/crm/${activeTab.toLowerCase()}/${editRecord.id}`;
      const { data } = await axiosInstance.put(endpoint, formData);
      if (data.success) {
        toast.success(`${activeTab.slice(0, -1)} updated successfully`);
        setEditRecord(null);
        setFormData({});
        refreshTab();
      } else {
        toast.error("Failed to update record");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update record");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1).toLowerCase()}?`)) return;
    setDeleting(true);
    try {
      const { data } = await axiosInstance.delete(`/zoho/crm/${activeTab.toLowerCase()}/${id}`);
      if (data.success) {
        toast.success(`${activeTab.slice(0, -1)} deleted successfully`);
        refreshTab();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      refreshTab();
      return;
    }
    setLoading(true);
    try {
      const module = activeTab === "Leads" ? "leads" : activeTab === "Contacts" ? "contacts" : "deals";
      const field = activeTab === "Deals" ? "Deal_Name" : "Last_Name";
      const criteria = `(${field}:contains:${searchQuery})`;
      const { data } = await axiosInstance.get(`/zoho/crm/${module}/search?criteria=${encodeURIComponent(criteria)}`);
      if (activeTab === "Leads") setLeads(data.data?.data || []);
      else if (activeTab === "Contacts") setContacts(data.data?.data || []);
      else setDeals(data.data?.data || []);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (module, id) => {
    setTimelineLoading(true);
    try {
      const { data } = await axiosInstance.get(`/zoho/crm/${module}/${id}/timeline`);
      setTimeline(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  const refreshTab = () => {
    if (activeTab === "Leads") fetchLeads();
    else if (activeTab === "Contacts") fetchContacts();
    else if (activeTab === "Deals") fetchDeals();
    else if (activeTab === "Pipeline") fetchPipeline();
    else if (activeTab === "Reports") fetchReports();
  };

  const startEdit = (record) => {
    setEditRecord(record);
    setFormData({ ...record });
    setShowForm(false);
  };

  const renderLeadForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Create New Lead</h6>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input className="form-control" value={formData.First_Name || ""} onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input className="form-control" required value={formData.Last_Name || ""} onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={formData.Email || ""} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input className="form-control" value={formData.Phone || ""} onChange={(e) => setFormData({ ...formData, Phone: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Company</label>
          <input className="form-control" value={formData.Company || ""} onChange={(e) => setFormData({ ...formData, Company: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Lead Source</label>
          <select className="form-select" value={formData.Lead_Source || ""} onChange={(e) => setFormData({ ...formData, Lead_Source: e.target.value })}>
            <option value="">Select</option>
            <option value="Sahayya App">Sahayya App</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Lead Status</label>
          <select className="form-select" value={formData.Lead_Status || ""} onChange={(e) => setFormData({ ...formData, Lead_Status: e.target.value })}>
            <option value="">Select</option>
            {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows="2" value={formData.Description || ""} onChange={(e) => setFormData({ ...formData, Description: e.target.value })} />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleCreateRecord}>Create Lead</button>
        <button className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  const renderContactForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Create New Contact</h6>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input className="form-control" value={formData.First_Name || ""} onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input className="form-control" required value={formData.Last_Name || ""} onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={formData.Email || ""} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input className="form-control" value={formData.Phone || ""} onChange={(e) => setFormData({ ...formData, Phone: e.target.value })} />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleCreateRecord}>Create Contact</button>
        <button className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  const renderDealForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Create New Deal</h6>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Deal Name *</label>
          <input className="form-control" required value={formData.Deal_Name || ""} onChange={(e) => setFormData({ ...formData, Deal_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Amount</label>
          <input className="form-control" type="number" value={formData.Amount || ""} onChange={(e) => setFormData({ ...formData, Amount: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Stage</label>
          <select className="form-select" value={formData.Stage || ""} onChange={(e) => setFormData({ ...formData, Stage: e.target.value })}>
            <option value="">Select</option>
            {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Closing Date</label>
          <input className="form-control" type="date" value={formData.Closing_Date || ""} onChange={(e) => setFormData({ ...formData, Closing_Date: e.target.value })} />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleCreateRecord}>Create Deal</button>
        <button className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  const renderEditForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Edit {activeTab.slice(0, -1)}</h6>
      <div className="row g-3">
        {activeTab === "Leads" && (
          <>
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input className="form-control" value={formData.First_Name || ""} onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input className="form-control" value={formData.Last_Name || ""} onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" value={formData.Email || ""} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" value={formData.Phone || ""} onChange={(e) => setFormData({ ...formData, Phone: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Company</label>
              <input className="form-control" value={formData.Company || ""} onChange={(e) => setFormData({ ...formData, Company: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Lead Status</label>
              <select className="form-select" value={formData.Lead_Status || ""} onChange={(e) => setFormData({ ...formData, Lead_Status: e.target.value })}>
                <option value="">Select</option>
                {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}
        {activeTab === "Contacts" && (
          <>
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input className="form-control" value={formData.First_Name || ""} onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input className="form-control" value={formData.Last_Name || ""} onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" value={formData.Email || ""} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" value={formData.Phone || ""} onChange={(e) => setFormData({ ...formData, Phone: e.target.value })} />
            </div>
          </>
        )}
        {activeTab === "Deals" && (
          <>
            <div className="col-md-6">
              <label className="form-label">Deal Name</label>
              <input className="form-control" value={formData.Deal_Name || ""} onChange={(e) => setFormData({ ...formData, Deal_Name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Amount</label>
              <input className="form-control" type="number" value={formData.Amount || ""} onChange={(e) => setFormData({ ...formData, Amount: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Stage</label>
              <select className="form-select" value={formData.Stage || ""} onChange={(e) => setFormData({ ...formData, Stage: e.target.value })}>
                <option value="">Select</option>
                {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Closing Date</label>
              <input className="form-control" type="date" value={formData.Closing_Date || ""} onChange={(e) => setFormData({ ...formData, Closing_Date: e.target.value })} />
            </div>
          </>
        )}
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleUpdateRecord}>Update {activeTab.slice(0, -1)}</button>
        <button className="btn btn-outline-secondary" onClick={() => { setEditRecord(null); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  const renderPipeline = () => (
    <div className="card sahayya-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0"><i className="fas fa-columns me-2"></i>Deal Pipeline</h6>
        <div style={{ fontSize: 13 }}>
          <span className="text-muted">Total: </span>
          <span className="fw-semibold" style={{ color: "#D98C7A" }}>{pipelineMeta.total_deals} deals</span>
          <span className="text-muted mx-2">|</span>
          <span className="fw-semibold" style={{ color: "#28a745" }}>₹{Number(pipelineMeta.total_amount).toLocaleString()}</span>
        </div>
      </div>
      {pipelineLoading ? (
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
          <p className="mt-2 text-muted">Loading pipeline...</p>
        </div>
      ) : pipeline.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-columns fa-2x mb-2"></i>
          <p>No deals in pipeline</p>
        </div>
      ) : (
        <div className="d-flex gap-3 overflow-auto pb-3" style={{ minHeight: 500 }}>
          {pipeline.map((col) => (
            <div
              key={col.stage}
              className="flex-shrink-0"
              style={{ width: 300, background: "#f8f9fa", borderRadius: 12, padding: 12 }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.stage)}
            >
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <span className="fw-bold" style={{ fontSize: 13 }}>{col.stage}</span>
                <span className="badge" style={{ background: "#D98C7A", color: "white", borderRadius: 10, fontSize: 11 }}>
                  {col.count} | ₹{Number(col.total_amount).toLocaleString()}
                </span>
              </div>
              <div className="d-flex flex-column gap-2">
                {col.deals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal, col.stage)}
                    className="pipeline-card"
                    style={{
                      background: "white", borderRadius: 8, padding: "10px 12px",
                      border: "1px solid #eee", cursor: "grab", fontSize: 13,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>{deal.Deal_Name}</div>
                    {deal.Amount && (
                      <div className="mb-1" style={{ fontSize: 12, color: "#28a745", fontWeight: 600 }}>
                        ₹{Number(deal.Amount).toLocaleString()}
                      </div>
                    )}
                    {deal.Contact_Name && (
                      <div style={{ fontSize: 11, color: "#888" }}>{deal.Contact_Name.name}</div>
                    )}
                    {deal.Closing_Date && (
                      <div style={{ fontSize: 11, color: "#aaa" }}>Close: {deal.Closing_Date}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="card sahayya-card p-4">
      <h6 className="fw-bold mb-3"><i className="fas fa-chart-bar me-2"></i>CRM Reports</h6>
      {reportsLoading ? (
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
          <p className="mt-2 text-muted">Loading reports...</p>
        </div>
      ) : reports ? (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-number">{reports.leads?.total || 0}</div>
              <div className="stat-label">Total Leads</div>
              {reports.leads?.by_status && (
                <div className="mt-2" style={{ fontSize: 12 }}>
                  {Object.entries(reports.leads.by_status).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between px-2">
                      <span>{status}</span>
                      <span className="fw-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-number">{reports.contacts?.total || 0}</div>
              <div className="stat-label">Total Contacts</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card">
              <div className="stat-number">{reports.deals?.total || 0}</div>
              <div className="stat-label">Total Deals</div>
              <div className="mt-1" style={{ fontSize: 13, color: "#28a745" }}>
                {reports.deals?.total_amount ? `₹${Number(reports.deals.total_amount).toLocaleString()}` : "₹0"}
              </div>
              {reports.deals?.by_stage && (
                <div className="mt-2" style={{ fontSize: 12 }}>
                  {Object.entries(reports.deals.by_stage).map(([stage, count]) => (
                    <div key={stage} className="d-flex justify-content-between px-2">
                      <span>{stage}</span>
                      <span className="fw-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted">No reports data available</div>
      )}
    </div>
  );

  return (
    <div className="container-fluid p-4">
      <style>{`
        .sahayya-card { border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .sahayya-btn-primary { background: #D98C7A; color: #fff; border: none; }
        .sahayya-btn-primary:hover { background: #c47b6a; color: #fff; }
        .crm-tab { padding: 8px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 500; }
        .crm-tab.active { background: #D98C7A; color: white; }
        .crm-tab:not(.active) { background: #f0f0f0; color: #333; }
        .crm-tab:not(.active):hover { background: #e0e0e0; }
        .stat-card { border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 20px; text-align: center; }
        .stat-number { font-size: 28px; font-weight: 700; color: #D98C7A; }
        .stat-label { font-size: 13px; color: #888; margin-top: 4px; }
        .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }

        .action-btn { padding: 4px 8px; border-radius: 6px; border: none; font-size: 12px; cursor: pointer; }
        .action-btn.edit { background: #e3f2fd; color: #1976d2; }
        .action-btn.edit:hover { background: #bbdefb; }
        .action-btn.delete { background: #fce4ec; color: #c62828; }
        .action-btn.delete:hover { background: #f8bbd0; }
        .action-btn.timeline { background: #e8f5e9; color: #2e7d32; }
        .action-btn.timeline:hover { background: #c8e6c9; }
        .search-bar { border-radius: 8px; border: 1px solid #ddd; padding: 8px 14px; font-size: 14px; }
        .search-bar:focus { border-color: #D98C7A; outline: none; box-shadow: 0 0 0 2px rgba(217,140,122,0.15); }
        .timeline-panel { background: #fafafa; border-radius: 12px; padding: 20px; border: 1px solid #eee; max-height: 400px; overflow-y: auto; }
        .pipeline-col { transition: background 0.2s; }
        .pipeline-col.drag-over { background: #e8f5e9 !important; }
        .pipeline-card { transition: transform 0.1s, box-shadow 0.1s; }
        .pipeline-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .pipeline-card:active { cursor: grabbing; }
      `}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Zoho CRM</h4>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Leads, contacts and deals from Sahayya</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success btn-sm" onClick={() => handleSync("staff")} disabled={syncing}>
            {syncing ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-sync me-1"></i>}
            Sync Staff
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => handleSync("owners")} disabled={syncing}>
            {syncing ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-sync me-1"></i>}
            Sync Owners
          </button>
        </div>
      </div>

      {/* STATS */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-number">{summary.leads}</div>
                <div className="stat-label">Total Leads</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-number">{summary.contacts}</div>
                <div className="stat-label">Total Contacts</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-number">{summary.deals}</div>
                <div className="stat-label">Total Deals</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-number" style={{ color: "#28a745" }}>
                  {summary.leads + summary.contacts + summary.deals}
                </div>
                <div className="stat-label">Total Records</div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="d-flex gap-2 mb-4">
            {TABS.map((tab) => (
              <button key={tab} className={`crm-tab ${activeTab === tab ? "active" : ""}`} onClick={() => { setActiveTab(tab); setShowForm(false); setFormData({}); setEditRecord(null); setSearchQuery(""); }}>
                {tab}
              </button>
            ))}
          </div>

          {/* SEARCH BAR + CREATE BUTTON (not for Reports/Pipeline tabs) */}
          {activeTab !== "Reports" && activeTab !== "Pipeline" && (
            <div className="d-flex gap-2 mb-3">
              <div className="d-flex gap-2 flex-grow-1">
                <input
                  className="search-bar flex-grow-1"
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="btn btn-outline-secondary btn-sm" onClick={handleSearch}>
                  <i className="fas fa-search"></i>
                </button>
                {searchQuery && (
                  <button className="btn btn-outline-danger btn-sm" onClick={() => { setSearchQuery(""); refreshTab(); }}>
                    <i className="fas fa-times"></i> Clear
                  </button>
                )}
              </div>
              <button className="btn sahayya-btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                <i className="fas fa-plus me-1"></i>Create {activeTab.slice(0, -1)}
              </button>
            </div>
          )}

          {/* FORMS */}
          {showForm && activeTab === "Leads" && renderLeadForm()}
          {showForm && activeTab === "Contacts" && renderContactForm()}
          {showForm && activeTab === "Deals" && renderDealForm()}
          {editRecord && renderEditForm()}

          {/* PIPELINE TAB */}
          {activeTab === "Pipeline" && renderPipeline()}

          {/* REPORTS TAB */}
          {activeTab === "Reports" && renderReports()}

          {/* DATA TABLE */}
          {activeTab !== "Reports" && activeTab !== "Pipeline" && (
            <div className="card sahayya-card p-4">
              {loading ? (
                <div className="text-center py-5">
                  <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                  <p className="mt-2 text-muted">Loading data from Zoho...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        {activeTab === "Leads" && (
                          <>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Company</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </>
                        )}
                        {activeTab === "Contacts" && (
                          <>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Account</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </>
                        )}
                        {activeTab === "Deals" && (
                          <>
                            <th>Deal Name</th>
                            <th>Amount</th>
                            <th>Stage</th>
                            <th>Closing Date</th>
                            <th>Contact</th>
                            <th>Actions</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab === "Leads" && leads.length === 0 && (
                        <tr><td colSpan="7" className="text-center py-4 text-muted">No leads found</td></tr>
                      )}
                      {activeTab === "Leads" && leads.map((lead, i) => (
                        <tr key={lead.id || i}>
                          <td className="fw-semibold">{lead.First_Name} {lead.Last_Name}</td>
                          <td>{lead.Email}</td>
                          <td>{lead.Phone}</td>
                          <td>{lead.Company}</td>
                          <td><span className="badge bg-light text-dark">{lead.Lead_Source}</span></td>
                          <td>
                            <span className="status-badge" style={{ background: STATUS_COLORS[lead.Lead_Status] || "#6c757d" }}>
                              {lead.Lead_Status || "New"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="action-btn edit" title="Edit" onClick={() => startEdit(lead)}><i className="fas fa-pen"></i></button>
                              <button className="action-btn timeline" title="Timeline" onClick={() => fetchTimeline("Leads", lead.id)}><i className="fas fa-clock"></i></button>
                              <button className="action-btn delete" title="Delete" onClick={() => handleDeleteRecord(lead.id)} disabled={deleting}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {activeTab === "Contacts" && contacts.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No contacts found</td></tr>
                      )}
                      {activeTab === "Contacts" && contacts.map((contact, i) => (
                        <tr key={contact.id || i}>
                          <td className="fw-semibold">{contact.First_Name} {contact.Last_Name}</td>
                          <td>{contact.Email}</td>
                          <td>{contact.Phone}</td>
                          <td>{contact.Account_Name?.name}</td>
                          <td>{contact.Created_Time}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="action-btn edit" title="Edit" onClick={() => startEdit(contact)}><i className="fas fa-pen"></i></button>
                              <button className="action-btn timeline" title="Timeline" onClick={() => fetchTimeline("Contacts", contact.id)}><i className="fas fa-clock"></i></button>
                              <button className="action-btn delete" title="Delete" onClick={() => handleDeleteRecord(contact.id)} disabled={deleting}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {activeTab === "Deals" && deals.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No deals found</td></tr>
                      )}
                      {activeTab === "Deals" && deals.map((deal, i) => (
                        <tr key={deal.id || i}>
                          <td className="fw-semibold">{deal.Deal_Name}</td>
                          <td>{deal.Amount ? `₹${Number(deal.Amount).toLocaleString()}` : "-"}</td>
                          <td><span className="badge bg-info">{deal.Stage}</span></td>
                          <td>{deal.Closing_Date}</td>
                          <td>{deal.Contact_Name?.name}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="action-btn edit" title="Edit" onClick={() => startEdit(deal)}><i className="fas fa-pen"></i></button>
                              <button className="action-btn timeline" title="Timeline" onClick={() => fetchTimeline("Deals", deal.id)}><i className="fas fa-clock"></i></button>
                              <button className="action-btn delete" title="Delete" onClick={() => handleDeleteRecord(deal.id)} disabled={deleting}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE PANEL */}
          {timeline.length > 0 && (
            <div className="card sahayya-card p-4 mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0"><i className="fas fa-clock me-2"></i>Activity Timeline</h6>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setTimeline([])}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              {timelineLoading ? (
                <div className="text-center py-3">
                  <i className="fas fa-spinner fa-spin"></i> Loading timeline...
                </div>
              ) : (
                <div className="timeline-panel">
                  {timeline.map((event, i) => (
                    <div key={i} className="d-flex gap-3 mb-3 pb-3 border-bottom" style={{ fontSize: 13 }}>
                      <div>
                        <i className="fas fa-circle" style={{ fontSize: 8, color: "#D98C7A", marginTop: 6 }}></i>
                      </div>
                      <div>
                        <div className="fw-semibold">{event.type || "Activity"}</div>
                        <div className="text-muted">{event.description || event.message}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{event.timestamp || event.created_time}</div>
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && <div className="text-muted text-center">No activity found</div>}
                </div>
              )}
            </div>
          )}
    </div>
  );
};

export default ZohoCRM;
