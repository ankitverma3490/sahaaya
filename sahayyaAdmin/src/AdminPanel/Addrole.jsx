import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES (injected once at top-level)
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
  .sahayya-btn-primary {
    background-color: #D98C7A !important;
    border-color: #D98C7A !important;
    color: white !important;
  }
  .sahayya-btn-primary:hover {
    background-color: #c77d6d !important;
    border-color: #c77d6d !important;
  }
  .role-add-btn {
    min-width: 180px;
    min-height: 52px;
    border-radius: 14px !important;
    font-size: 1rem;
    font-weight: 700;
    box-shadow: 0 10px 24px rgba(217, 140, 122, 0.24);
  }
  .skill-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0ebe9;
    border: 1px solid #D98C7A;
    color: #6b3d35;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 0.82rem;
    font-weight: 600;
    margin: 3px 4px 3px 0;
  }
  .skill-tag .remove-skill {
    cursor: pointer;
    color: #c04040;
    font-size: 1rem;
    line-height: 1;
    background: none;
    border: none;
    padding: 0;
  }
  .skill-tag .remove-skill:hover { color: #900; }
  .skill-tag-active {
    background: #D98C7A;
    color: #fff;
    border-color: #D98C7A;
  }
  .skills-row td { background: #fdf7f5 !important; }
  .expand-btn { transition: transform 0.2s; }
  .expand-btn.open { transform: rotate(180deg); }
`;

const DEFAULT_IMAGE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPQHstFutlfl8tgZAtY8nDWucSWEvFM5AETQ&s";

/* ─────────────────────────────────────────────────────────────────────────────
   SKILL TAG INPUT (reusable inside modal and inline panel)
───────────────────────────────────────────────────────────────────────────── */
const SkillTagInput = ({ skills, onAdd, onRemove }) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    if (skills.map((s) => s.toLowerCase()).includes(val.toLowerCase())) {
      toast.warning("Skill already added");
      return;
    }
    onAdd(val);
    setInput("");
  };

  return (
    <div>
      {/* tag list */}
      <div className="d-flex flex-wrap mb-2" style={{ minHeight: 32 }}>
        {skills.length === 0 && (
          <span className="text-muted" style={{ fontSize: "0.82rem" }}>
            No skills added yet
          </span>
        )}
        {skills.map((s, i) => (
          <span key={i} className="skill-tag skill-tag-active">
            {s}
            <button
              type="button"
              className="remove-skill"
              onClick={() => onRemove(i)}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* input row */}
      <div className="input-group input-group-sm">
        <input
          className="form-control"
          placeholder="Type a skill & press Enter or Add"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
        />
        <button
          type="button"
          className="btn sahayya-btn-primary"
          onClick={handleAdd}
        >
          + Add
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE SKILLS PANEL (shown when a role row is expanded)
───────────────────────────────────────────────────────────────────────────── */
const InlineSkillsPanel = ({ roleId }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillName, setEditingSkillName] = useState("");

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/category/subcategories?parent_id=${roleId}`);
      if (res?.data?.success) {
        setSkills(res.data.data || []);
      }
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const handleAddSkill = async () => {
    const val = newSkillInput.trim();
    if (!val) return;
    if (skills.some((s) => s.name.toLowerCase() === val.toLowerCase())) {
      toast.warning("Skill already exists");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(DEFAULT_IMAGE);
      const blob = await response.blob();
      const fd = new FormData();
      fd.append("name", val);
      fd.append("parent_id", roleId);
      fd.append("image", blob, "default.jpg");
      await axiosInstance.post("/category/save", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Skill "${val}" added`);
      setNewSkillInput("");
      fetchSkills();
    } catch {
      toast.error("Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id, name) => {
    if (!window.confirm(`Delete skill "${name}"?`)) return;
    try {
      await axiosInstance.delete(`/category/${id}`);
      toast.success("Skill deleted");
      fetchSkills();
    } catch {
      toast.error("Failed to delete skill");
    }
  };

  const handleUpdateSkill = async (id) => {
    if (!editingSkillName.trim()) {
      toast.warning("Skill name required");
      return;
    }
    try {
      await axiosInstance.post(`/category/update/${id}`, {
        name: editingSkillName.trim(),
      });
      toast.success("Skill updated");
      setEditingSkillId(null);
      setEditingSkillName("");
      fetchSkills();
    } catch {
      toast.error("Failed to update skill");
    }
  };

  return (
    <tr className="skills-row">
      <td colSpan={3} className="px-4 py-3">
        <strong className="text-muted d-block mb-2" style={{ fontSize: "0.85rem" }}>
          Skills for this role
        </strong>

        {loading ? (
          <div className="spinner-border spinner-border-sm text-secondary" />
        ) : (
          <div className="d-flex flex-wrap mb-3" style={{ minHeight: 30 }}>
            {skills.length === 0 && (
              <span className="text-muted" style={{ fontSize: "0.82rem" }}>
                No skills yet — add below
              </span>
            )}
            {skills.map((s) => (
              <span key={s.id} className="skill-tag">
                {editingSkillId === s.id ? (
                  <input
                    className="form-control form-control-sm d-inline-block"
                    style={{ width: 120, fontSize: "0.82rem", padding: "2px 6px" }}
                    value={editingSkillName}
                    onChange={(e) => setEditingSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateSkill(s.id);
                      if (e.key === "Escape") setEditingSkillId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingSkillId(s.id);
                      setEditingSkillName(s.name);
                    }}
                    title="Double-click to edit"
                    style={{ cursor: "pointer" }}
                  >
                    {s.name}
                  </span>
                )}
                {editingSkillId === s.id ? (
                  <>
                    <button
                      type="button"
                      className="remove-skill"
                      style={{ color: "#047857" }}
                      onClick={() => handleUpdateSkill(s.id)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="remove-skill"
                      onClick={() => setEditingSkillId(null)}
                      title="Cancel"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="remove-skill"
                    onClick={() => handleDeleteSkill(s.id, s.name)}
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* add new skill inline */}
        <div className="input-group input-group-sm" style={{ maxWidth: 380 }}>
          <input
            className="form-control"
            placeholder="New skill name…"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddSkill())
            }
          />
          <button
            type="button"
            className="btn sahayya-btn-primary"
            onClick={handleAddSkill}
            disabled={saving}
          >
            {saving ? "…" : "+ Add Skill"}
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
const Addrole = () => {
  const [roleList, setRoleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null); // id of currently expanded row

  // Add-role modal state
  const [roleName, setRoleName] = useState("");
  const [modalSkills, setModalSkills] = useState([]); // skills typed before save

  // Edit-role modal state
  const [editingRole, setEditingRole] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const modalRef = useRef(null);

  /* ── fetch roles ─────────────────────────────────────────────────────────── */
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/category");
      if (res?.data?.success) setRoleList(res.data.data || []);
    } catch {
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  /* ── save role + skills ──────────────────────────────────────────────────── */
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.warning("Role name required");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create the role (category)
      const imgResponse = await fetch(DEFAULT_IMAGE);
      const blob = await imgResponse.blob();
      const fd = new FormData();
      fd.append("name", roleName.trim());
      fd.append("image", blob, "default.jpg");

      const res = await axiosInstance.post("/category/save", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newRoleId = res?.data?.data?.id;

      // 2. Save each skill as subcategory
      if (newRoleId && modalSkills.length > 0) {
        await Promise.all(
          modalSkills.map(async (skill) => {
            const sfd = new FormData();
            sfd.append("name", skill);
            sfd.append("parent_id", newRoleId);
            sfd.append("image", blob, "default.jpg");
            await axiosInstance.post("/category/save", sfd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          })
        );
      }

      toast.success(
        `Role added${modalSkills.length ? ` with ${modalSkills.length} skill(s)` : ""}!`
      );

      // reset & close modal
      setRoleName("");
      setModalSkills([]);
      const modalEl = document.getElementById("addRoleModal");
      const instance = window.bootstrap?.Modal?.getInstance(modalEl);
      instance?.hide();

      fetchRoles();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save role");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete role ─────────────────────────────────────────────────────────── */
  const handleDeleteRole = async (id) => {
    if (!window.confirm("Delete this role and ALL its skills?")) return;
    try {
      await axiosInstance.delete(`/category/${id}`);
      toast.success("Role deleted");
      if (expandedRole === id) setExpandedRole(null);
      fetchRoles();
    } catch {
      toast.error("Failed to delete role");
    }
  };

  /* ── edit role ──────────────────────────────────────────────────────────── */
  const openEditModal = (role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
  };

  const handleUpdateRole = async () => {
    if (!editRoleName.trim()) {
      toast.warning("Role name required");
      return;
    }
    setEditSaving(true);
    try {
      await axiosInstance.post(`/category/update/${editingRole.id}`, {
        name: editRoleName.trim(),
      });
      toast.success("Role updated");
      const modalEl = document.getElementById("editRoleModal");
      const instance = window.bootstrap?.Modal?.getInstance(modalEl);
      instance?.hide();
      setEditingRole(null);
      fetchRoles();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setEditSaving(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>
      <style>{STYLES}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Role &amp; Skills Management</h2>
        <button
          className="btn sahayya-btn-primary role-add-btn px-4"
          data-bs-toggle="modal"
          data-bs-target="#addRoleModal"
        >
          + Add Role
        </button>
      </div>

      {/* TABLE */}
      <div className="card p-0 shadow-sm">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-secondary" />
          </div>
        ) : (
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 50 }}>Sr.</th>
                <th>Role Name</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roleList.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-5">
                    No roles yet. Click <strong>+ Add Role</strong> to create one.
                  </td>
                </tr>
              )}
              {roleList.map((role, index) => (
                <React.Fragment key={role.id}>
                  <tr>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{role.name}</strong>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {/* expand / collapse skills */}
                        <button
                          className={`btn btn-sm btn-outline-secondary expand-btn ${
                            expandedRole === role.id ? "open" : ""
                          }`}
                          title={
                            expandedRole === role.id ? "Hide skills" : "View / Add skills"
                          }
                          onClick={() =>
                            setExpandedRole(
                              expandedRole === role.id ? null : role.id
                            )
                          }
                        >
                          ⌄ Skills
                        </button>

                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openEditModal(role)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* inline skills panel */}
                  {expandedRole === role.id && (
                    <InlineSkillsPanel roleId={role.id} />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD ROLE MODAL */}
      <div className="modal fade" id="addRoleModal" ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0 pb-0">
              <h5 className="fw-bold">Add New Role</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>

            <div className="modal-body pt-2">
              {/* Role name */}
              <div className="mb-4">
                <label className="fw-semibold mb-1">Role Name *</label>
                <input
                  className="form-control"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Cook / Chef"
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                />
              </div>

              {/* Skills */}
              <div className="mb-2">
                <label className="fw-semibold mb-1">
                  Skills &amp; Specialties{" "}
                  <span className="text-muted fw-normal">(optional, multiple)</span>
                </label>
                <SkillTagInput
                  skills={modalSkills}
                  onAdd={(s) => setModalSkills((prev) => [...prev, s])}
                  onRemove={(i) =>
                    setModalSkills((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
                <div className="form-text text-muted mt-1">
                  Type a skill and press <kbd>Enter</kbd> or click <strong>+ Add</strong>.
                  You can also add / edit skills later from the table.
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => {
                  setRoleName("");
                  setModalSkills([]);
                }}
              >
                Cancel
              </button>
              <button
                className="btn sahayya-btn-primary px-4"
                onClick={handleSaveRole}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving…
                  </>
                ) : (
                  "Save Role"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT ROLE MODAL */}
      <div className="modal fade" id="editRoleModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0 pb-0">
              <h5 className="fw-bold">Edit Role</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>

            <div className="modal-body pt-2">
              <div className="mb-3">
                <label className="fw-semibold mb-1">Role Name *</label>
                <input
                  className="form-control"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="e.g. Cook / Chef"
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateRole()}
                />
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => setEditingRole(null)}
              >
                Cancel
              </button>
              <button
                className="btn sahayya-btn-primary px-4"
                onClick={handleUpdateRole}
                disabled={editSaving}
              >
                {editSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Updating…
                  </>
                ) : (
                  "Update Role"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Addrole;
