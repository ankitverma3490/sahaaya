import React, { useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

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
  const address = staff?.addresses?.find((a) => a.address_type === "present") || staff?.addresses?.[0] || {};
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

const getGenderLabel = (staff) => {
  const raw = String(staff?.gender || "").trim().toLowerCase();
  if (raw === "m" || raw === "male") return "Male";
  if (raw === "f" || raw === "female") return "Female";
  if (raw === "o" || raw === "other") return "Other";
  return formatValue(staff?.gender);
};

const getCurrentSubscription = (staff) => staff?.current_subscription || null;

const getCreditBalance = (staff) => {
  const wallet = Number(staff?.wallet || 0);
  const referral = Number(staff?.referral_earnings || 0);
  return wallet + referral;
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

const StaffManagement = () => {
  const { ownerId } = useParams();

  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOwner = async () => {
    try {
      const res = await axiosInstance.get(`/admin/houseowners/${ownerId}`);
      if (res.data.success && res.data.data) {
        const o = res.data.data;
        const fullName = `${o.first_name || ""} ${o.last_name || ""}`.trim() || o.name || `House Owner #${ownerId}`;
        setOwnerName(fullName);
      }
    } catch (error) {
      toast.error("Failed to fetch owner details");
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axiosInstance.get("/admin/staff", {
        params: { user_id: ownerId },
      });

      if (res.data.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setStaffList(list);
        setFilteredStaff(list);
      }
    } catch (error) {
      toast.error("Failed to fetch staff");
    }
  };

  const blockStaff = async (staffId) => {
    try {
      await axiosInstance.put(`/admin/staff/${staffId}/status`, {
        status: "block",
      });

      toast.success("Staff Blocked Successfully");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to Block Staff");
    }
  };

  const openStaffDetails = async (staff) => {
    try {
      setViewLoading(true);
      setSelectedStaff(staff);
      const res = await axiosInstance.get(`/admin/staff/${staff.id}`);
      if (res.data.success && res.data.data) {
        setSelectedStaff(res.data.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load full staff profile");
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    fetchOwner();
    fetchStaff();
  }, [ownerId]);

  useEffect(() => {
    let result = [...staffList];

    if (search.trim()) {
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.phone_number?.includes(search)
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredStaff(result);
  }, [search, statusFilter, staffList]);

  const currentSubscription = getCurrentSubscription(selectedStaff);
  const documents = selectedStaff ? getDocumentItems(selectedStaff) : [];

  return (
    <div className="container-fluid p-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">{ownerName || "House Owner"} Staff</h3>
        </div>

        <Link to="/admin/house-owners" className="btn btn-outline-secondary">
          <IoChevronBack /> Back
        </Link>
      </div>

      {/* FILTER CARD */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="block">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Sr.</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Aadhar Number</th>
                <th>Phone</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    No Staff Found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, index) => (
                  <tr key={staff.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={staff.image || "https://ui-avatars.com/api/?name=Staff&background=random"}
                        className="rounded-circle border"
                        width={45}
                        height={45}
                        alt=""
                        style={{ objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = "https://ui-avatars.com/api/?name=Staff&background=random";
                        }}
                      />
                    </td>

                    <td>
                      <strong>{getStaffName(staff)}</strong>
                      <br />
                      <small className="text-muted">ID: {staff.id}</small>
                    </td>
                    <td>{staff.email || "-"}</td>
                    <td>{staff.aadhar_number || "-"}</td>

                    <td>{staff.phone_number || "-"}</td>
                    <td>{staff.dob || staff.date_of_birth || "-"}</td>
                    <td>{getGenderLabel(staff)}</td>

                    <td>
                      <span
                        className={`badge rounded-pill ${
                          staff.status === "active"
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        }`}
                      >
                        {staff.status || "active"}
                      </span>
                    </td>

                    <td className="text-end">
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-danger dropdown-toggle"
                          data-bs-toggle="dropdown"
                        >
                          Action
                        </button>

                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item text-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#viewStaffModal"
                              onClick={() => openStaffDetails(staff)}
                            >
                              View Staff
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-warning"
                              onClick={() => blockStaff(staff.id)}
                            >
                              {staff.status === "active" ? "Block Staff" : "Activate Staff"}
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL COMPLETE DETAILS VIEW MODAL */}
      <div className="modal fade" id="viewStaffModal" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-bold mb-1">Staff Profile</h5>
                <small className="text-muted">Complete profile, membership and verification details</small>
              </div>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body">
              {viewLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger me-2" role="status"></div>
                  <span className="text-muted">Loading full staff details...</span>
                </div>
              ) : selectedStaff ? (
                <div className="row g-4">
                  {/* LEFT SUMMARY CARD */}
                  <div className="col-lg-4">
                    <div className="border rounded-4 p-4 h-100 bg-white">
                      <div className="text-center mb-4">
                        <img
                          src={selectedStaff.image || "https://ui-avatars.com/api/?name=Staff&background=random"}
                          width="90"
                          height="90"
                          className="rounded-circle border mb-3"
                          alt="Staff"
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src = "https://ui-avatars.com/api/?name=Staff&background=random";
                          }}
                        />
                        <h4 className="mb-1 fw-bold">{getStaffName(selectedStaff)}</h4>
                        <p className="text-muted mb-0">{selectedStaff.email || "No email"}</p>
                      </div>

                      <div className="border rounded-3 p-3 mb-3 bg-light">
                        <small className="text-muted d-block">Current Membership</small>
                        <div className="fw-bold">
                          {currentSubscription?.subscription?.subscription_name || "Staff Free Plan"}
                        </div>
                        <small className="text-muted">
                          {currentSubscription?.end_date
                            ? `Valid till ${new Date(currentSubscription.end_date).toLocaleDateString()}`
                            : "Lifetime Access"}
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

                  {/* RIGHT COMPLETE PROFILE DETAILS */}
                  <div className="col-lg-8">
                    <h6 className="fw-bold mb-3">Profile Information</h6>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <small className="text-muted d-block">First Name</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.first_name)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Last Name</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.last_name)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Email</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.email)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Phone</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.phone_number)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Date of Birth</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.date_of_birth || selectedStaff.dob)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Gender</small>
                        <span className="fw-semibold">{getGenderLabel(selectedStaff)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Status</small>
                        <span className={`badge ${selectedStaff.status === "active" ? "bg-success" : "bg-danger"}`}>
                          {selectedStaff.status || "active"}
                        </span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Occupation</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.occupation || getWorkInfo(selectedStaff)?.primary_role)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Service Category</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.service_category || getWorkInfo(selectedStaff)?.service_category)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Primary Role</small>
                        <span className="fw-semibold">{formatValue(getWorkInfo(selectedStaff)?.primary_role || selectedStaff.occupation)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Salary</small>
                        <span className="fw-semibold">{formatValue(getWorkInfo(selectedStaff)?.salary || selectedStaff.salary)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Pay Frequency</small>
                        <span className="fw-semibold">{formatValue(getWorkInfo(selectedStaff)?.pay_frequency || selectedStaff.pay_frequency)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Preferred Work Location</small>
                        <span className="fw-semibold">{formatValue(getWorkInfo(selectedStaff)?.preferred_work_location || selectedStaff.preferred_work_location)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Stay Type</small>
                        <span className="fw-semibold">{formatValue(getWorkInfo(selectedStaff)?.stay_type || selectedStaff.stay_type)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Area / Locality</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.area_locality || getPrimaryAddress(selectedStaff).area_locality)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">City</small>
                        <span className="fw-semibold">{formatValue(getPrimaryAddress(selectedStaff).city)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">State</small>
                        <span className="fw-semibold">{formatValue(getPrimaryAddress(selectedStaff).state)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Pincode</small>
                        <span className="fw-semibold">{formatValue(getPrimaryAddress(selectedStaff).pincode)}</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Emergency Contact Relation</small>
                        <span className="fw-semibold">{formatValue(selectedStaff.relation || getWorkInfo(selectedStaff)?.relation)}</span>
                      </div>
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
                              <td>
                                {formatValue(getWorkInfo(selectedStaff)?.emergency_contact_name)} / {formatValue(getWorkInfo(selectedStaff)?.emergency_contact_number || selectedStaff?.contact_number)}
                              </td>
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

                    {/* UPLOADED DOCUMENTS */}
                    <h6 className="mt-4 mb-3 fw-bold">Uploaded Documents</h6>
                    {documents.length === 0 ? (
                      <div className="alert alert-light border py-2 mb-0 text-muted small">
                        No documents uploaded by this staff member.
                      </div>
                    ) : (
                      <div className="row g-3">
                        {documents.map((doc) => {
                          const isPdf = String(doc.url).toLowerCase().includes(".pdf");
                          return (
                            <div className="col-md-6" key={doc.label}>
                              <div className="border rounded-3 p-3 h-100">
                                <strong className="d-block mb-2 small">{doc.label}</strong>
                                {isPdf ? (
                                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                                    View PDF Document
                                  </a>
                                ) : (
                                  <img
                                    src={doc.url}
                                    className="img-fluid border rounded d-block"
                                    alt={doc.label}
                                    style={{ maxHeight: 180, objectFit: "contain" }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
