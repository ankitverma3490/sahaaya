import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const defaultStaffForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  dob: "",
  gender: "",
  status: "active",
  occupation: "",
  service_category: "",
  area_locality: "",
  google_location: "",
  lat: "",
  long: "",
  current_city: "",
  current_state: "",
  current_pincode: "",
  salary: "",
  pay_frequency: "",
  primary_role: "",
  preferred_work_location: "",
  stay_type: "",
  relation: "",
};

const formatValue = (value) => {
  if (Array.isArray(value)) {
    const cleaned = value.filter(Boolean);
    return cleaned.length ? cleaned.join(", ") : "-";
  }

  return value === null || value === undefined || value === "" ? "-" : value;
};

const getStaffName = (staff) =>
  staff?.first_name && staff?.last_name
    ? `${staff.first_name} ${staff.last_name}`
    : staff?.name || "-";

const getPrimaryAddress = (staff) => {
  const address = staff?.addresses?.find(a => a.address_type === 'present') || staff?.addresses?.[0] || {};
  return {
    street: address.street || address.locality || staff?.current_street || staff?.permanent_street || "-",
    city: address.city || staff?.current_city || staff?.permanent_city || "-",
    state: address.state || staff?.current_state || staff?.permanent_state || "-",
    pincode: address.pincode || staff?.current_pincode || staff?.permanent_pincode || "-",
    area_locality: address.area_locality || staff?.area_locality || "-",
    google_location: address.google_location || staff?.google_location || "-",
    lat: address.lat || address.latitude || staff?.lat || "-",
    long: address.long || address.longitude || staff?.long || "-",
  };
};

const getWorkInfo = (staff) => staff?.user_work_info || staff?.userWorkInfo || {};
const getKycInfo = (staff) => staff?.kyc_information || staff?.kycInformation || {};
const getLastExperience = (staff) => staff?.last_exp || staff?.lastExp || {};

const buildStaffForm = (staff) => {
  const workInfo = getWorkInfo(staff);

  return {
    first_name: staff?.first_name || "",
    last_name: staff?.last_name || "",
    email: staff?.email || "",
    phone_number: staff?.phone_number || "",
    dob: staff?.date_of_birth || staff?.dob || "",
    gender: staff?.gender || "",
    status: staff?.status || "active",
    occupation: staff?.occupation || workInfo?.primary_role || "",
    service_category: staff?.service_category || workInfo?.service_category || "",
    area_locality: staff?.area_locality || getPrimaryAddress(staff).area_locality || "",
    google_location: staff?.google_location || getPrimaryAddress(staff).google_location || "",
    lat: staff?.lat || getPrimaryAddress(staff).lat || "",
    long: staff?.long || getPrimaryAddress(staff).long || "",
    current_city: staff?.current_city || getPrimaryAddress(staff).city || "",
    current_state: staff?.current_state || getPrimaryAddress(staff).state || "",
    current_pincode: staff?.current_pincode || getPrimaryAddress(staff).pincode || "",
    salary: workInfo?.salary || staff?.salary || "",
    pay_frequency: workInfo?.pay_frequency || staff?.pay_frequency || "",
    primary_role: workInfo?.primary_role || staff?.occupation || "",
    preferred_work_location: workInfo?.preferred_work_location || staff?.preferred_work_location || "",
    stay_type: workInfo?.stay_type || staff?.stay_type || "",
    relation: staff?.relation || workInfo?.relation || "",
  };
};

const getPhone = (staff) => {
  const prefix = staff?.phone_number_country_code || staff?.phone_number_prefix || staff?.country_code || "";
  const number = staff?.phone_number || staff?.mobile_number || staff?.mobile || staff?.contact_number || "";
  const combined = `${prefix}${number}`.trim();
  return combined || "-";
};

const getGenderLabel = (staff) => {
  const raw = String(staff?.gender || "").trim().toLowerCase();
  if (raw === "m") return "Male";
  if (raw === "f") return "Female";
  if (raw === "o") return "Other";
  return formatValue(staff?.gender);
};

const getCurrentSubscription = (staff) => staff?.current_subscription || null;

const getCreditBalance = (staff) => {
  const wallet = Number(staff?.wallet || 0);
  const referral = Number(staff?.referral_earnings || 0);
  return wallet + referral;
};

const AllStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [staffForm, setStaffForm] = useState(defaultStaffForm);
  const [staffEditMode, setStaffEditMode] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);

  const fetchStaff = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/stafflist", {
        params: { page, search: searchTerm },
      });

      if (res.data.success) {
        setStaffList(res.data.data.data);
        setPagination(res.data.data);
        setCurrentPage(res.data.data.current_page);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchStaff(1, value);
  };

  const openStaffDetails = async (staff) => {
    try {
      setViewLoading(true);
      setStaffEditMode(false);
      setSelectedStaff(staff);
      setStaffForm(buildStaffForm(staff));
      const res = await axiosInstance.get(`/admin/staff/${staff.id}`);

      if (res.data.success) {
        setSelectedStaff(res.data.data);
        setStaffForm(buildStaffForm(res.data.data));
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load full staff profile");
    } finally {
      setViewLoading(false);
    }
  };

  const saveStaffUpdate = async () => {
    if (!selectedStaff?.id) return;

    try {
      setStaffSaving(true);
      const res = await axiosInstance.put(`/admin/staff/${selectedStaff.id}`, staffForm);

      if (res?.data?.success) {
        setSelectedStaff(res.data.data);
        setStaffForm(buildStaffForm(res.data.data));
        setStaffEditMode(false);
        toast.success("Staff updated successfully");
        fetchStaff(currentPage, search);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to update staff");
    } finally {
      setStaffSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axiosInstance.delete(`/admin/staff/${deleteTargetId}`);
      toast.success("Staff deleted successfully");
      setDeleteTargetId(null);
      fetchStaff(currentPage, search);
      const modal = window.bootstrap?.Modal?.getInstance(document.getElementById("deleteModal"));
      modal?.hide();
    } catch (error) {
      console.log(error);
      toast.error("Delete failed");
    }
  };

  const changeStatus = async (staff) => {
    const newStatus = staff.status === "active" ? "block" : "active";
    try {
      await axiosInstance.put(`/admin/staff/${staff.id}/status`, { status: newStatus });
      toast.success("Status updated");
      fetchStaff(currentPage, search);
    } catch (error) {
      console.log(error);
      toast.error("Status update failed");
    }
  };

  const renderDocumentCard = (item) => {
    const isPdf = String(item.url).toLowerCase().includes(".pdf");

    return (
      <div className="col-md-6 mb-3" key={item.label}>
        <div className="border rounded-3 p-3 h-100">
          <strong className="d-block mb-2">{item.label}</strong>
          {isPdf ? (
            <a href={item.url} target="_blank" rel="noreferrer">View Document</a>
          ) : (
            <img src={item.url} className="img-fluid border rounded d-block" alt={item.label} />
          )}
        </div>
      </div>
    );
  };

  const getDocumentItems = (staff) => {
    const kyc = getKycInfo(staff);
    const workInfo = getWorkInfo(staff);

    return [
      {
        label: "Aadhaar Front",
        url: kyc?.aadhaar_front_path || staff?.aadhar_front || workInfo?.aadhar_front,
      },
      {
        label: "Aadhaar Back",
        url: kyc?.aadhaar_back_path || staff?.aadhar_back || workInfo?.aadhar_back,
      },
      {
        label: "Police Verification",
        url: kyc?.police_verification_path || staff?.verification_certificate || workInfo?.verification_certificate,
      },
      {
        label: "Staff Photo",
        url: staff?.image,
      },
    ].filter((item) => item.url);
  };

  const renderField = (label, key, value, type = "text") => (
    <div className="col-md-4">
      <small className="text-muted d-block">{label}</small>
      {staffEditMode ? (
        <input
          type={type}
          className="form-control"
          value={staffForm[key] || ""}
          onChange={(event) => setStaffForm((prev) => ({ ...prev, [key]: event.target.value }))}
        />
      ) : (
        <div className="fw-semibold">{formatValue(value)}</div>
      )}
    </div>
  );

  const currentSubscription = getCurrentSubscription(selectedStaff);

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-4">All Staff</h2>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search by name, phone, Aadhaar or role..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="card p-4">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Aadhaar</th>
                <th>Aadhaar Verified</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center">Loading...</td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No Staff Found</td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <img
                        src={staff.image || "https://ui-avatars.com/api/?name=Staff&background=random"}
                        width="40"
                        height="40"
                        className="rounded-circle border"
                        alt="Staff"
                        onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Staff&background=random"; }}
                      />
                    </td>
                    <td>{getStaffName(staff)}</td>
                    <td>{staff.email || "-"}</td>
                    <td>{getPhone(staff)}</td>
                    <td>{staff.aadhar_number || "-"}</td>
                    <td>
                      <span className={`badge ${staff.aadhar__verify ? "bg-success" : "bg-danger"}`}>
                        {staff.aadhar__verify ? "Verified" : "Not Verified"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${staff.status === "active" ? "bg-success" : "bg-danger"}`}>
                        {staff.status || "active"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          data-bs-toggle="modal"
                          data-bs-target="#viewModal"
                          onClick={() => openStaffDetails(staff)}
                        >
                          View
                        </button>

                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => changeStatus(staff)}
                        >
                          {staff.status === "active" ? "Block" : "Activate"}
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          data-bs-toggle="modal"
                          data-bs-target="#deleteModal"
                          onClick={() => setDeleteTargetId(staff.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.last_page > 1 && (
          <div className="d-flex justify-content-end mt-3">
            <ul className="pagination mb-0">
              {[...Array(pagination.last_page)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                  <button className="page-link" onClick={() => fetchStaff(i + 1, search)}>
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="modal fade" id="viewModal" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-bold mb-1">Staff Profile</h5>
                <small className="text-muted">Edit profile, review membership and credit balance</small>
              </div>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            {selectedStaff && (
              <div className="modal-body">
                {viewLoading ? (
                  <div className="text-center py-4">Loading full staff details...</div>
                ) : (
                  <div className="row g-4">
                    <div className="col-lg-4">
                      <div className="border rounded-4 p-4 h-100">
                        <div className="text-center mb-4">
                          <img
                            src={selectedStaff.image || "https://ui-avatars.com/api/?name=Staff&background=random"}
                            width="90"
                            height="90"
                            className="rounded-circle border mb-3"
                            alt="Staff"
                            onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Staff&background=random"; }}
                          />
                          <h4 className="mb-1">{getStaffName(selectedStaff)}</h4>
                          <p className="text-muted mb-0">{selectedStaff.email || "No email"}</p>
                        </div>

                        <div className="border rounded-3 p-3 mb-3 bg-light">
                          <small className="text-muted d-block">Current Membership</small>
                          <div className="fw-bold">
                            {currentSubscription?.subscription?.subscription_name || "No active membership"}
                          </div>
                          <small className="text-muted">
                            {currentSubscription?.end_date
                              ? `Valid till ${new Date(currentSubscription.end_date).toLocaleDateString()}`
                              : "Not available"}
                          </small>
                        </div>

                        <div className="border rounded-3 p-3 bg-light">
                          <small className="text-muted d-block">Credit Balance</small>
                          <div className="fw-bold">₹ {getCreditBalance(selectedStaff).toFixed(2)}</div>
                          <small className="text-muted">
                            Wallet: ₹ {Number(selectedStaff?.wallet || 0).toFixed(2)} | Referral: ₹ {Number(selectedStaff?.referral_earnings || 0).toFixed(2)}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-8">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Profile Information</h6>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${staffEditMode ? "btn-outline-secondary" : "btn-outline-primary"}`}
                            onClick={() => {
                              setStaffEditMode((prev) => !prev);
                              setStaffForm(buildStaffForm(selectedStaff));
                            }}
                          >
                            {staffEditMode ? "Cancel Edit" : "Edit User"}
                          </button>
                          {staffEditMode ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={saveStaffUpdate}
                              disabled={staffSaving}
                            >
                              {staffSaving ? "Saving..." : "Save Changes"}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="row g-3">
                        {renderField("First Name", "first_name", selectedStaff.first_name)}
                        {renderField("Last Name", "last_name", selectedStaff.last_name)}
                        {renderField("Email", "email", selectedStaff.email, "email")}
                        {renderField("Phone", "phone_number", selectedStaff.phone_number)}
                        {renderField("Date of Birth", "dob", selectedStaff.date_of_birth || selectedStaff.dob)}
                        {renderField("Gender", "gender", getGenderLabel(selectedStaff))}
                        {renderField("Status", "status", selectedStaff.status)}
                        {renderField("Occupation", "occupation", selectedStaff.occupation || getWorkInfo(selectedStaff)?.primary_role)}
                        {renderField("Service Category", "service_category", selectedStaff.service_category || getWorkInfo(selectedStaff)?.service_category)}
                        {renderField("Primary Role", "primary_role", getWorkInfo(selectedStaff)?.primary_role || selectedStaff.occupation)}
                        {renderField("Salary", "salary", getWorkInfo(selectedStaff)?.salary || selectedStaff.salary, "number")}
                        {renderField("Pay Frequency", "pay_frequency", getWorkInfo(selectedStaff)?.pay_frequency || selectedStaff.pay_frequency)}
                        {renderField("Preferred Work Location", "preferred_work_location", getWorkInfo(selectedStaff)?.preferred_work_location || selectedStaff.preferred_work_location)}
                        {renderField("Stay Type", "stay_type", getWorkInfo(selectedStaff)?.stay_type || selectedStaff.stay_type)}
                        {renderField("Area / Locality", "area_locality", selectedStaff.area_locality || getPrimaryAddress(selectedStaff).area_locality)}
                        {renderField("Google Location URL", "google_location", selectedStaff.google_location || getPrimaryAddress(selectedStaff).google_location)}
                        {renderField("Latitude", "lat", selectedStaff.lat || getPrimaryAddress(selectedStaff).lat)}
                        {renderField("Longitude", "long", selectedStaff.long || getPrimaryAddress(selectedStaff).long)}
                        {renderField("City", "current_city", getPrimaryAddress(selectedStaff).city)}
                        {renderField("State", "current_state", getPrimaryAddress(selectedStaff).state)}
                        {renderField("Pincode", "current_pincode", getPrimaryAddress(selectedStaff).pincode)}
                        {renderField("Emergency Contact Relation", "relation", selectedStaff.relation || getWorkInfo(selectedStaff)?.relation)}
                      </div>

                      <hr className="my-4" />

                      <div className="row g-4">
                        <div className="col-lg-6">
                          <table className="table table-sm table-bordered mb-0">
                            <tbody>
                              <tr>
                                <th>Aadhaar No.</th>
                                <td>{selectedStaff.aadhar_number || "-"}</td>
                              </tr>
                              <tr>
                                <th>Aadhaar Verified</th>
                                <td>
                                  <span className={`badge ${selectedStaff.aadhar__verify ? "bg-success" : "bg-danger"}`}>
                                    {selectedStaff.aadhar__verify ? "Verified" : "Not Verified"}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <th>Emergency Contact</th>
                                <td>{formatValue(getWorkInfo(selectedStaff)?.emergency_contact_name)} / {formatValue(getWorkInfo(selectedStaff)?.emergency_contact_number || selectedStaff?.contact_number)}</td>
                              </tr>
                              <tr>
                                <th>UPI ID</th>
                                <td>{formatValue(selectedStaff.upi_id)}</td>
                              </tr>
                              <tr>
                                <th>Availability</th>
                                <td>{selectedStaff?.is_available ? "Available" : "Not Available"}</td>
                              </tr>
                              <tr>
                                <th>Job Seeking</th>
                                <td>{selectedStaff?.is_job_seeking ? "Yes" : "No"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="col-lg-6">
                          <table className="table table-sm table-bordered mb-0">
                            <tbody>
                              <tr>
                                <th>Street</th>
                                <td>{formatValue(getPrimaryAddress(selectedStaff).street)}</td>
                              </tr>
                              <tr>
                                <th>Skills</th>
                                <td>{formatValue(getWorkInfo(selectedStaff)?.skills || selectedStaff?.skills)}</td>
                              </tr>
                              <tr>
                                <th>Languages</th>
                                <td>{formatValue(getWorkInfo(selectedStaff)?.languages_spoken || selectedStaff?.languages_spoken)}</td>
                              </tr>
                              <tr>
                                <th>Working Days</th>
                                <td>{formatValue(getWorkInfo(selectedStaff)?.working_days || selectedStaff?.working_days)}</td>
                              </tr>
                              <tr>
                                <th>Joining Date</th>
                                <td>{formatValue(getWorkInfo(selectedStaff)?.joining_date || getLastExperience(selectedStaff)?.join_date)}</td>
                              </tr>
                              <tr>
                                <th>Last Experience</th>
                                <td>{formatValue(getLastExperience(selectedStaff)?.role)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <h6 className="mt-4 mb-3 fw-bold">Uploaded Documents</h6>
                      {getDocumentItems(selectedStaff).length === 0 ? (
                        <div className="alert alert-warning py-2 mb-0">
                          No documents uploaded by this staff member.
                        </div>
                      ) : (
                        <div className="row">
                          {getDocumentItems(selectedStaff).map(renderDocumentCard)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal fade" id="deleteModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Delete</h5>
              <button className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Are you sure you want to <strong>permanently delete</strong> this staff member?
                This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStaff;
