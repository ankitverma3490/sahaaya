import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const defaultOwnerForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  dob: "",
  gender: "",
  status: "active",
  area_locality: "",
  google_location: "",
  lat: "",
  long: "",
  current_city: "",
  current_state: "",
  current_pincode: "",
};

const formatValue = (value) => {
  if (Array.isArray(value)) {
    const cleaned = value.filter(Boolean);
    return cleaned.length ? cleaned.join(", ") : "-";
  }

  return value === null || value === undefined || value === "" ? "-" : value;
};

const getOwnerName = (owner) =>
  `${owner?.first_name || ""} ${owner?.last_name || ""}`.trim() || owner?.name || "House Owner";

const getAddress = (owner) => {
  const primaryAddress = owner?.addresses?.find(a => a.address_type === 'present') || owner?.addresses?.[0] || {};
  return {
    street: primaryAddress?.street || owner?.current_street || "-",
    city: primaryAddress?.city || owner?.current_city || "-",
    state: primaryAddress?.state || owner?.current_state || "-",
    pincode: primaryAddress?.pincode || owner?.current_pincode || "-",
    area_locality: primaryAddress?.area_locality || owner?.area_locality || "-",
    google_location: primaryAddress?.google_location || owner?.google_location || "-",
    lat: primaryAddress?.lat || primaryAddress?.latitude || owner?.lat || "-",
    long: primaryAddress?.long || primaryAddress?.longitude || owner?.long || "-",
  };
};

const getHouseholdInfo = (owner) => owner?.household_information || owner?.householdInformation || {};
const getPetDetails = (owner) => owner?.pet_details || owner?.petDetails || [];

const getCurrentSubscription = (owner) => owner?.current_subscription || null;

const getCreditBalance = (owner) => {
  const wallet = Number(owner?.wallet || 0);
  const referral = Number(owner?.referral_earnings || 0);
  return wallet + referral;
};

const buildOwnerForm = (owner) => {
  const address = owner?.addresses?.find(a => a.address_type === 'present') || owner?.addresses?.[0] || {};
  return {
    first_name: owner?.first_name || "",
    last_name: owner?.last_name || "",
    email: owner?.email || "",
    phone_number: owner?.phone_number || "",
    dob: owner?.dob || owner?.date_of_birth || "",
    gender: owner?.gender || "",
    status: owner?.status || "active",
    area_locality: owner?.area_locality || address?.area_locality || "",
    google_location: owner?.google_location || address?.google_location || "",
    lat: owner?.lat || address?.lat || "",
    long: owner?.long || address?.long || "",
    current_city: owner?.current_city || address?.city || "",
    current_state: owner?.current_state || address?.state || "",
    current_pincode: owner?.current_pincode || address?.pincode || "",
  };
};

const HouseOwners = () => {
  const [owners, setOwners] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerViewLoading, setOwnerViewLoading] = useState(false);
  const [ownerForm, setOwnerForm] = useState(defaultOwnerForm);
  const [ownerEditMode, setOwnerEditMode] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ownersPerPage = 5;

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/houseowners");

      if (res.data.success) {
        const data = res.data.data.data || [];
        setOwners(data);
        setFilteredOwners(data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch house owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    const filtered = owners.filter((owner) =>
      getOwnerName(owner).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(owner.phone_number || "").includes(searchTerm)
    );

    setFilteredOwners(filtered);
    setCurrentPage(1);
  }, [searchTerm, owners]);

  const indexOfLastOwner = currentPage * ownersPerPage;
  const indexOfFirstOwner = indexOfLastOwner - ownersPerPage;
  const currentOwners = filteredOwners.slice(indexOfFirstOwner, indexOfLastOwner);
  const totalPages = Math.ceil(filteredOwners.length / ownersPerPage);

  const handleDeleteOwner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this owner?")) return;

    try {
      const res = await axiosInstance.delete(`/admin/houseowners/${id}`);
      if (res.data.success || res.data.status) {
        toast.success("House owner deleted successfully");
        setOwners((prev) => prev.filter((owner) => owner.id !== id));
        setFilteredOwners((prev) => prev.filter((owner) => owner.id !== id));
        fetchOwners();
      }
    } catch (error) {
      console.log(error);
      toast.error("Delete failed");
    }
  };

  const openOwnerDetails = async (owner) => {
    try {
      setOwnerViewLoading(true);
      setOwnerEditMode(false);
      setSelectedOwner(owner);
      setOwnerForm(buildOwnerForm(owner));

      const res = await axiosInstance.get(`/admin/houseowners/${owner.id}`);
      if (res.data.success) {
        setSelectedOwner(res.data.data);
        setOwnerForm(buildOwnerForm(res.data.data));
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load owner details");
    } finally {
      setOwnerViewLoading(false);
    }
  };

  const saveOwnerUpdate = async () => {
    if (!selectedOwner?.id) return;

    try {
      setOwnerSaving(true);
      const res = await axiosInstance.put(`/admin/houseowners/${selectedOwner.id}`, ownerForm);

      if (res?.data?.success) {
        const updatedOwner = res.data.data;
        setSelectedOwner(updatedOwner);
        setOwnerForm(buildOwnerForm(updatedOwner));
        setOwnerEditMode(false);
        toast.success("House owner updated successfully");
        fetchOwners();
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to update owner");
    } finally {
      setOwnerSaving(false);
    }
  };

  const renderOwnerField = (label, key, value, type = "text") => (
    <div className="col-md-4">
      <small className="text-muted d-block">{label}</small>
      {ownerEditMode ? (
        <input
          type={type}
          className="form-control"
          value={ownerForm[key] || ""}
          onChange={(event) => setOwnerForm((prev) => ({ ...prev, [key]: event.target.value }))}
        />
      ) : (
        <div className="fw-semibold">{formatValue(value)}</div>
      )}
    </div>
  );

  const selectedSubscription = getCurrentSubscription(selectedOwner);

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h2 className="fw-bold mb-0">House Owners</h2>

        <input
          type="text"
          className="form-control"
          style={{ maxWidth: "280px" }}
          placeholder="Search name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card p-4">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Profile</th>
                <th>Name</th>
                <th>Phone</th>
                <th>DOB</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center">Loading...</td>
                </tr>
              ) : currentOwners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No Data Found</td>
                </tr>
              ) : (
                currentOwners.map((owner, index) => (
                  <tr key={owner.id}>
                    <td>{indexOfFirstOwner + index + 1}</td>
                    <td>
                      <img
                        src={owner.image || "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"}
                        width={50}
                        height={50}
                        className="rounded-2"
                        alt="House Owner"
                        style={{ objectFit: "cover" }}
                      />
                    </td>
                    <td className="fw-bold">{getOwnerName(owner)}</td>
                    <td>{owner.phone_number || "-"}</td>
                    <td>{owner.dob || owner.date_of_birth || "-"}</td>
                    <td>
                      <span className={`badge ${owner.status === "active" ? "bg-success" : "bg-secondary"}`}>
                        {owner.status || "inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link to={`/admin/staffManagement/${owner.id}`}>
                        <button className="btn btn-sm btn-primary me-2">View Staff</button>
                      </Link>

                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#viewOwnerModal"
                        onClick={() => openOwnerDetails(owner)}
                      >
                        View Details
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteOwner(owner.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-end mt-3">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage((prev) => prev - 1)}>
                    Previous
                  </button>
                </li>

                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage((prev) => prev + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      <div className="modal fade" id="viewOwnerModal" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content border-0 rounded-4">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title fw-bold mb-1">House Owner Details</h5>
                <small className="text-muted">View, edit, membership and credit summary</small>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body px-4 pb-4">
              {selectedOwner ? (
                ownerViewLoading ? (
                  <div className="text-center py-4">Loading full owner details...</div>
                ) : (
                  <div className="row g-4">
                    <div className="col-lg-4">
                      <div className="border rounded-4 p-4 h-100">
                        <div className="text-center mb-4">
                          <img
                            src={selectedOwner.image || "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"}
                            alt="House Owner"
                            className="rounded-circle border mb-3"
                            width="110"
                            height="110"
                            style={{ objectFit: "cover" }}
                          />
                          <h5 className="fw-bold mb-1">{getOwnerName(selectedOwner)}</h5>
                          <small className="text-muted text-capitalize">{selectedOwner.status || "active"}</small>
                        </div>

                        <div className="border rounded-3 p-3 mb-3 bg-light">
                          <small className="text-muted d-block">Current Membership</small>
                          <div className="fw-bold">
                            {selectedSubscription?.subscription?.subscription_name || "No active membership"}
                          </div>
                          <small className="text-muted">
                            {selectedSubscription?.end_date
                              ? `Valid till ${new Date(selectedSubscription.end_date).toLocaleDateString()}`
                              : "Not available"}
                          </small>
                        </div>

                        <div className="border rounded-3 p-3 bg-light">
                          <small className="text-muted d-block">Credit Balance</small>
                          <div className="fw-bold">INR {getCreditBalance(selectedOwner).toFixed(2)}</div>
                          <small className="text-muted">
                            Wallet: INR {Number(selectedOwner?.wallet || 0).toFixed(2)} | Referral: INR {Number(selectedOwner?.referral_earnings || 0).toFixed(2)}
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
                            className={`btn btn-sm ${ownerEditMode ? "btn-outline-secondary" : "btn-outline-primary"}`}
                            onClick={() => {
                              setOwnerEditMode((prev) => !prev);
                              setOwnerForm(buildOwnerForm(selectedOwner));
                            }}
                          >
                            {ownerEditMode ? "Cancel Edit" : "Edit User"}
                          </button>
                          {ownerEditMode ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={saveOwnerUpdate}
                              disabled={ownerSaving}
                            >
                              {ownerSaving ? "Saving..." : "Save Changes"}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="row g-3">
                        {renderOwnerField("First Name", "first_name", selectedOwner.first_name)}
                        {renderOwnerField("Last Name", "last_name", selectedOwner.last_name)}
                        {renderOwnerField("Email", "email", selectedOwner.email, "email")}
                        {renderOwnerField("Phone", "phone_number", selectedOwner.phone_number)}
                        {renderOwnerField("Date of Birth", "dob", selectedOwner.dob || selectedOwner.date_of_birth)}
                        {renderOwnerField("Gender", "gender", selectedOwner.gender)}
                        {renderOwnerField("Status", "status", selectedOwner.status)}
                        {renderOwnerField("Area / Locality", "area_locality", selectedOwner.area_locality || getAddress(selectedOwner).area_locality)}
                        {renderOwnerField("Google Location URL", "google_location", selectedOwner.google_location || getAddress(selectedOwner).google_location)}
                        {renderOwnerField("Latitude", "lat", selectedOwner.lat || getAddress(selectedOwner).lat)}
                        {renderOwnerField("Longitude", "long", selectedOwner.long || getAddress(selectedOwner).long)}
                        {renderOwnerField("City", "current_city", selectedOwner.current_city || getAddress(selectedOwner).city)}
                        {renderOwnerField("State", "current_state", selectedOwner.current_state || getAddress(selectedOwner).state)}
                        {renderOwnerField("Pincode", "current_pincode", selectedOwner.current_pincode || getAddress(selectedOwner).pincode)}
                      </div>

                      <hr className="my-4" />

                      <h6 className="fw-bold mb-3">Address Details</h6>
                      <div className="row g-3">
                        <div className="col-md-12">
                          <small className="text-muted d-block">Street</small>
                          <div className="fw-semibold">{formatValue(getAddress(selectedOwner).street)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">City</small>
                          <div className="fw-semibold">{formatValue(getAddress(selectedOwner).city)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">State</small>
                          <div className="fw-semibold">{formatValue(getAddress(selectedOwner).state)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Pincode</small>
                          <div className="fw-semibold">{formatValue(getAddress(selectedOwner).pincode)}</div>
                        </div>
                      </div>

                      <hr className="my-4" />

                      <h6 className="fw-bold mb-3">Household Details</h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <small className="text-muted d-block">Residence Type</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.residence_type)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Rooms</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.number_of_rooms)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Languages Spoken</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.languages_spoken)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Adults</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.adults_count)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Children</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.children_count)}</div>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted d-block">Elderly</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.elderly_count)}</div>
                        </div>
                        <div className="col-md-12">
                          <small className="text-muted d-block">Special Requirements</small>
                          <div className="fw-semibold">{formatValue(getHouseholdInfo(selectedOwner)?.special_requirements)}</div>
                        </div>
                      </div>

                      <hr className="my-4" />

                      <h6 className="fw-bold mb-3">Pet Details</h6>
                      {getPetDetails(selectedOwner).length > 0 ? (
                        <div className="row g-3">
                          {getPetDetails(selectedOwner).map((pet, index) => (
                            <div className="col-md-6" key={`${pet?.pet_type || "pet"}-${index}`}>
                              <div className="border rounded-3 p-3 h-100">
                                <small className="text-muted d-block">Pet Type</small>
                                <div className="fw-semibold mb-2">{formatValue(pet?.pet_type)}</div>
                                <small className="text-muted d-block">Pet Count</small>
                                <div className="fw-semibold">{formatValue(pet?.pet_count)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">No pet details available.</div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-muted">Select an owner to view details.</div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseOwners;
