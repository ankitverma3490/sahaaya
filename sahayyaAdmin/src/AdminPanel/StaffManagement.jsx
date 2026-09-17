import React, { useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const StaffManagement = () => {

  const { ownerId } = useParams();

  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOwner = async () => {
    try {
      const res = await axiosInstance.get(`/admin/houseowners/${ownerId}`);
      if (res.data.success) {
        setOwnerName(res.data.data.first_name + " " + res.data.data.last_name);
      }
    } catch (error) {
      toast.error("Failed to fetch owner details");
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axiosInstance.get("/admin/staff", {
        params: { user_id: ownerId }
      });

      if (res.data.success) {
        setStaffList(res.data.data.data);
        setFilteredStaff(res.data.data.data);
      }

    } catch (error) {
      toast.error("Failed to fetch staff");
    }
  };

  const blockStaff = async (staffId) => {
    try {

      await axiosInstance.put(`/admin/staff/${staffId}/status`, {
        status: "block"
      });

      toast.success("Staff Blocked Successfully");
      fetchStaff();

    } catch (error) {
      toast.error("Failed to Block Staff");
    }
  };

  useEffect(() => {

    let data = [...staffList];

    if (search) {
      data = data.filter((s) =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone_number?.includes(search)
      );
    }

    if (statusFilter) {
      data = data.filter((s) => s.status === statusFilter);
    }

    setFilteredStaff(data);

  }, [search, statusFilter, staffList]);

  useEffect(() => {
    fetchOwner();
    fetchStaff();
  }, [ownerId]);

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>

      <style>{`
        .sahayya-btn-primary {
          background-color: #D98C7A !important;
          border-color: #D98C7A !important;
          color: #fff !important;
        }
        .sahayya-card {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .staff-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }
      `}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">{ownerName} Staff</h2>

        <Link to="/admin/house-owners">
          <button className="btn sahayya-btn-primary">
            <IoChevronBack className="me-2" />Back
          </button>
        </Link>
      </div>

      {/* CARD */}
      <div className="card sahayya-card p-4">

        {/* SEARCH + FILTER */}
        <div className="row g-3 mb-4">

          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Search by name or phone..."
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

        {/* TABLE */}
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
                  <td colSpan="10" className="text-center">No Staff Found</td>
                </tr>
              ) : (
                filteredStaff.map((staff, index) => (
                  <tr key={staff.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={staff.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRyI0ai9leWsm7sSXtYeRKRyzG8W3p0XrUJw&s"}
                        className="staff-img border"
                        alt=""
                      />
                    </td>

                    <td>
                      <strong>{staff.name}</strong>
                      <br />
                      <small className="text-muted">
                        ID: {staff.id}
                      </small>
                    </td>
                    <td>{staff.email}</td>
                    <td>{staff.aadhar_number}</td>

                    <td>{staff.phone_number}</td>
                    <td>{staff.dob}</td>
                    <td>{staff.gender}</td>

                    <td>
                      <span className={`badge rounded-pill 
                        ${staff.status === "active"
                          ? "bg-success-subtle text-success"
                          : "bg-danger-subtle text-danger"}`}>
                        {staff.status}
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
                              onClick={() => setSelectedStaff(staff)}
                            >
                              View Staff
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-warning"
                              onClick={() => blockStaff(staff.id)}
                            >
                              Block Staff
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

      {/* VIEW MODAL */}
      <div className="modal fade" id="viewStaffModal">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">Staff Profile</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body">

              {selectedStaff && (
                <>
                  <div className="text-center mb-3">
                    <img
                      src={selectedStaff.image}
                      width="120"
                      className="rounded-circle border"
                      alt=""
                    />
                    <h5 className="mt-2">{selectedStaff.name}</h5>
                  </div>

                  <p><strong>Email:</strong> {selectedStaff.email}</p>
                  <p><strong>Phone:</strong> {selectedStaff.phone_number}</p>
                  <p><strong>Status:</strong> {selectedStaff.status}</p>
                </>
              )}

            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default StaffManagement;
