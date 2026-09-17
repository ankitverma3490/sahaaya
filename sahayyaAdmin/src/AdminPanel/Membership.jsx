import React, { useState, useEffect } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";
import "./Membership.css";
import SubscriptionHistory from "./SubscriptionHistory";
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiMinus } from "react-icons/fi";

const Membership = () => {

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [formData, setFormData] = useState({
    subscription_name: "",
    description: "",
    price: "",
    validity: "",
    type: "",
    role_id: "2",
    job_limit: "",
    staff_limit: "",
    subscription_limit: "",
    extra: [{ feature: "" }],
    extra_job_price: "",
    extra_staff_price: "",
  });

  /* ================= FETCH ================= */
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/subscriptions");
      if (res.data.status) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  /* ================= MODAL ================= */
  const handleOpenModal = (plan = null) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({
        subscription_name: plan.subscription_name || "",
        description: plan.description || "",
        price: plan.price ?? "",
        validity: plan.validity ?? "",
        type: plan.type
          ? plan.type.charAt(0).toUpperCase() + plan.type.slice(1)
          : "",
        role_id: plan.role_id ? String(plan.role_id) : "2",
        job_limit: plan.job_limit ?? "",
        staff_limit: plan.staff_limit ?? "",
        subscription_limit: plan.subscription_limit ?? "",
        extra: plan.extra?.length ? plan.extra : [{ feature: "" }],
        extra_job_price: plan.extra_job_price ?? "",
        extra_staff_price: plan.extra_staff_price ?? "",
      });
    } else {
      setSelectedPlan(null);
      setFormData({
        subscription_name: "",
        description: "",
        price: "",
        validity: "",
        type: "",
        role_id: "2",
        job_limit: "",
        staff_limit: "",
        subscription_limit: "",
        extra: [{ feature: "" }],
        extra_job_price: "",
        extra_staff_price: "",
      });
    }
  };

  /* ================= FEATURES ================= */
  const addFeature = () => {
    setFormData({ ...formData, extra: [...formData.extra, { feature: "" }] });
  };

  const updateFeature = (i, value) => {
    const updated = [...formData.extra];
    updated[i] = { feature: value };
    setFormData({ ...formData, extra: updated });
  };

  const removeFeature = (i) => {
    const updated = formData.extra.filter((_, idx) => idx !== i);
    setFormData({ ...formData, extra: updated });
  };

  /* ================= SAVE ================= */
  const handleSavePlan = async () => {
    if (!formData.subscription_name || formData.price === "" || formData.price === null || formData.price === undefined || !formData.type) {
      toast.warning("Please fill required fields");
      return;
    }

    if (
      String(formData.role_id) === "3" &&
      (formData.job_limit === "" || formData.job_limit === null || formData.job_limit === undefined)
    ) {
      toast.warning("Job limit is required");
      return;
    }

    if (
      String(formData.role_id) === "3" &&
      (formData.staff_limit === "" || formData.staff_limit === null || formData.staff_limit === undefined)
    ) {
      toast.warning("Staff limit is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        job_limit: String(formData.role_id) === "3" ? Number(formData.job_limit) : 0,
        staff_limit: String(formData.role_id) === "3" ? Number(formData.staff_limit) : 0,
        subscription_limit: Number(formData.subscription_limit || 0),
        extra_job_price: String(formData.role_id) === "3" ? Number(formData.extra_job_price || 0) : 0,
        extra_staff_price: String(formData.role_id) === "3" ? Number(formData.extra_staff_price || 0) : 0,
        type: formData.type.toLowerCase(),
        validity:
          formData.validity ||
          (formData.type === "Monthly"
            ? 30
            : formData.type === "Quarterly"
              ? 90
              : 365),
      };

      if (selectedPlan) {
        await axiosInstance.put(`/admin/subscriptions/${selectedPlan.id}`, payload);
        toast.success("Plan updated successfully");
      } else {
        await axiosInstance.post("/admin/subscriptions", payload);
        toast.success("Plan created successfully");
      }

      const modal = window.bootstrap?.Modal?.getInstance(
        document.getElementById("planModal")
      );
      modal?.hide();

      fetchPlans();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await axiosInstance.delete(`/admin/subscriptions/${id}`);
      toast.success("Plan deleted");
      fetchPlans();
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="membership-container">
      <div className="container-fluid p-4">
        {/* HEADER */}
        <div className="membership-header">
          <h1 className="membership-title">Membership Plans</h1>
          <button
            className="btn-add-plan"
            data-bs-toggle="modal"
            data-bs-target="#planModal"
            onClick={() => handleOpenModal()}
          >
            <FiPlus /> Add New Plan
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Fetching plans...</p>
          </div>
        )}

        {/* LIST */}
        <div className="plan-grid">
          {plans.map((p) => (
            <div className="plan-card" key={p.id}>
              <span className="plan-badge">{p.type}</span>
              <h2 className="plan-name">{p.subscription_name}</h2>
              <p className="plan-description">{p.description || "Unlock premium features and boost your property visibility."}</p>

              <div className="plan-price-container">
                <span className="plan-price-symbol">₹</span>
                <span className="plan-price">{p.price}</span>
                <span className="plan-price-period">/{p.type}</span>
              </div>

              <div className="plan-stats">
                {String(p.role_id) === "3" && (
                  <>
                    <div className="plan-stat-item">
                      <span className="plan-stat-label">Job Limit</span>
                      <span className="plan-stat-value">{Number(p.job_limit)} Jobs</span>
                    </div>
                    <div className="plan-stat-item">
                      <span className="plan-stat-label">Staff Limit</span>
                      <span className="plan-stat-value">{Number(p.staff_limit)} Staff</span>
                    </div>
                    <div className="plan-stat-item">
                      <span className="plan-stat-label">Extra Job Price</span>
                      <span className="plan-stat-value">&#8377;{Number(p.extra_job_price || 0)}</span>
                    </div>
                    <div className="plan-stat-item">
                      <span className="plan-stat-label">Extra Staff Price</span>
                      <span className="plan-stat-value">&#8377;{Number(p.extra_staff_price || 0)}</span>
                    </div>
                  </>
                )}
                <div className="plan-stat-item">
                  <span className="plan-stat-label">Role</span>
                  <span className="plan-stat-value">{String(p.role_id) === "3" ? "House Owner" : "Staff"}</span>
                </div>
              </div>

              <ul className="plan-features">
                {p.extra?.map((f, i) => (
                  f.feature && (
                    <li className="plan-feature-item" key={i}>
                      <FiCheckCircle className="plan-feature-icon" />
                      {f.feature}
                    </li>
                  )
                ))}
              </ul>

              <div className="plan-actions">
                <button
                  className="btn-plan-edit"
                  data-bs-toggle="modal"
                  data-bs-target="#planModal"
                  onClick={() => handleOpenModal(p)}
                >
                  <FiEdit2 className="me-1" /> Edit
                </button>
                <button
                  className="btn-plan-delete"
                  onClick={() => handleDeletePlan(p.id)}
                >
                  <FiTrash2 className="me-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* SUBSCRIPTION HISTORY */}
        <div className="mt-5">
          <SubscriptionHistory />
        </div>

        {/* MODAL */}
        <div className="modal fade premium-modal" id="planModal" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedPlan ? "Edit Subscription Plan" : "Create New Plan"}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <label className="premium-form-label">Plan Name</label>
                    <input
                      className="form-control premium-input"
                      placeholder="e.g. Premium Plus"
                      value={formData.subscription_name}
                      onChange={(e) =>
                        setFormData({ ...formData, subscription_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="premium-form-label">User Role</label>
                    <select
                      className="form-select premium-input"
                      value={formData.role_id}
                      onChange={(e) =>
                        setFormData({ ...formData, role_id: e.target.value })
                      }
                    >
                      <option value="">Select Role</option>
                      <option value="3">House Owner</option>
                      <option value="2">Staff</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <label className="premium-form-label">Price (₹)</label>
                    <input
                      className="form-control premium-input"
                      placeholder="0.00"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="premium-form-label">Billing Cycle</label>
                    <select
                      className="form-select premium-input"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="">Select Cycle</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                {String(formData.role_id) === "3" && (
                  <>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="premium-form-label">Job Posting Limit</label>
                        <input
                          className="form-control premium-input"
                          placeholder="Number of jobs allowed"
                          type="number"
                          value={formData.job_limit}
                          onChange={(e) =>
                            setFormData({ ...formData, job_limit: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="premium-form-label">Staff Addition Limit</label>
                        <input
                          className="form-control premium-input"
                          placeholder="Number of staff allowed"
                          type="number"
                          value={formData.staff_limit}
                          onChange={(e) =>
                            setFormData({ ...formData, staff_limit: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <label className="premium-form-label">Extra Job Price (₹)</label>
                        <input
                          className="form-control premium-input"
                          placeholder="Price to post an extra job"
                          type="number"
                          value={formData.extra_job_price}
                          onChange={(e) =>
                            setFormData({ ...formData, extra_job_price: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="premium-form-label">Extra Staff Price (₹)</label>
                        <input
                          className="form-control premium-input"
                          placeholder="Price to add extra staff"
                          type="number"
                          value={formData.extra_staff_price}
                          onChange={(e) =>
                            setFormData({ ...formData, extra_staff_price: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="mb-3">
                  <label className="premium-form-label d-flex justify-content-between align-items-center">
                    Plan Features
                    <button type="button" className="btn btn-sm btn-outline-success" onClick={addFeature}>
                      <FiPlus /> Add
                    </button>
                  </label>
                  {formData.extra.map((feat, i) => (
                    <div key={i} className="feature-input-group">
                      <input
                        className="form-control premium-input mb-0"
                        placeholder="e.g. Priority Support"
                        value={feat.feature}
                        onChange={(e) => updateFeature(i, e.target.value)}
                      />
                      {formData.extra.length > 1 && (
                        <button className="btn btn-outline-danger" onClick={() => removeFeature(i)}>
                          <FiMinus />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  className="btn-save-plan"
                  onClick={handleSavePlan}
                  disabled={submitting}
                >
                  {submitting ? "Saving Plan..." : selectedPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;

