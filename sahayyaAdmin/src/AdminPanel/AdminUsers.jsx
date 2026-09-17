import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { ADMIN_MODULES } from "../utiles/adminPermissions";

const initialForm = {
  id: null,
  name: "",
  email: "",
  phone_number: "",
  password: "",
  permissions: [],
  is_active: true,
};

const AdminUsers = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/admin/sub-admins");
      setSubAdmins(response?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAdmins();
  }, []);

  const togglePermission = (permission) => {
    setForm((prev) => {
      const hasPermission = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter((item) => item !== permission)
          : [...prev.permissions, permission],
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        permissions: form.permissions,
        is_active: form.is_active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (isEditing) {
        await axiosInstance.post(`/admin/sub-admins/${form.id}`, payload);
        setSuccess("Sub-admin updated successfully.");
      } else {
        await axiosInstance.post("/admin/sub-admins", {
          ...payload,
          password: form.password,
        });
        setSuccess("Sub-admin created successfully.");
      }

      resetForm();
      loadSubAdmins();
    } catch (err) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)?.[0]?.[0];
        setError(firstError || "Validation failed.");
      } else {
        setError(err?.response?.data?.message || "Failed to save sub-admin.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setForm({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      password: "",
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      is_active: Boolean(user.is_active),
    });
    setSuccess("");
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sub-admin user?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/sub-admins/${id}`);
      setSuccess("Sub-admin deleted successfully.");
      if (form.id === id) {
        resetForm();
      }
      loadSubAdmins();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete sub-admin.");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setError("");
      setSuccess("");
      await axiosInstance.put(`/admin/sub-admins/${id}/status`);
      setSuccess("Sub-admin status updated successfully.");
      loadSubAdmins();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update sub-admin status.");
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Admin Users</h2>
          <small className="text-muted">Create sub-admins and limit module access.</small>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">{isEditing ? "Edit Sub-Admin" : "Create Sub-Admin"}</h5>

              {error ? <div className="alert alert-danger">{error}</div> : null}
              {success ? <div className="alert alert-success">{success}</div> : null}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="Enter email"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-control"
                    value={form.phone_number}
                    onChange={(event) => setForm({ ...form, phone_number: event.target.value })}
                    placeholder="Optional phone number"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Password {isEditing ? <span className="text-muted">(leave blank to keep current)</span> : null}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Module Permissions</label>
                  <div className="row g-2">
                    {ADMIN_MODULES.map((module) => (
                      <div className="col-md-6" key={module.key}>
                        <label className="border rounded-3 p-2 w-100 d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(module.key)}
                            onChange={() => togglePermission(module.key)}
                          />
                          <span>{module.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                  />
                  <label className="form-check-label">Active account</label>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-success" disabled={saving}>
                    {saving ? "Saving..." : isEditing ? "Update Sub-Admin" : "Create Sub-Admin"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Sub-Admin List</h5>
                <button className="btn btn-outline-success btn-sm" onClick={loadSubAdmins}>
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-muted">Loading admin users...</div>
              ) : subAdmins.length === 0 ? (
                <div className="text-muted">No sub-admin users created yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Permissions</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subAdmins.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="fw-semibold">{user.name}</div>
                            <small className="text-muted">{user.phone_number || "No phone"}</small>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${user.is_active ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <small>{(user.permissions || []).join(", ")}</small>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button className="btn btn-outline-primary btn-sm" onClick={() => handleEdit(user)}>
                                Edit
                              </button>
                              <button
                                className={`btn btn-sm ${user.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                                onClick={() => handleToggleStatus(user.id)}
                              >
                                {user.is_active ? "Block" : "Activate"}
                              </button>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(user.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
