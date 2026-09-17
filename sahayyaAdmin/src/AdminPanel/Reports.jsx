import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const formatCurrency = (value) => `INR ${Number(value || 0).toFixed(2)}`;

const cardStyle = {
  border: "none",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const Reports = () => {
  const [filter, setFilter] = useState("monthly");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (type) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/admin/report", { type });

      if (res.data.status === "success") {
        setReportData(res.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(filter);
  }, [filter]);

  const revenuePoints = reportData?.chartdata?.revenue_overview || [];
  const jobStatusOverview = reportData?.job_status_overview || {};
  const hiringReport = reportData?.hiring_report || {};
  const topJobPostings = reportData?.top_job_postings || [];

  const revenueChartData = {
    labels:
      revenuePoints.length > 0
        ? revenuePoints.map((item) => item.label)
        : filter === "monthly"
          ? ["Week 1", "Week 2", "Week 3", "Week 4"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue",
        data:
          revenuePoints.length > 0
            ? revenuePoints.map((item) => item.revenue ?? item.amount ?? 0)
            : [0, 0, 0, 0],
        backgroundColor: "#D98C7A",
        borderRadius: 8,
      },
    ],
  };

  const hiringChartData = {
    labels: ["Pending", "Reviewed", "Accepted", "Rejected"],
    datasets: [
      {
        label: "Applications",
        data: [
          hiringReport.pending || 0,
          hiringReport.reviewed || 0,
          hiringReport.accepted || 0,
          hiringReport.rejected || 0,
        ],
        backgroundColor: ["#f59e0b", "#3b82f6", "#16a34a", "#ef4444"],
        borderRadius: 8,
      },
    ],
  };

  const jobPostingChartData = {
    labels: ["Open", "Pending", "Closed", "Paused"],
    datasets: [
      {
        data: [
          jobStatusOverview.open || 0,
          jobStatusOverview.pending || 0,
          jobStatusOverview.closed || 0,
          jobStatusOverview.paused || 0,
        ],
        backgroundColor: ["#16a34a", "#f59e0b", "#64748b", "#8b5cf6"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Reports</h2>
          <small className="text-muted">Revenue, hiring and job posting performance</small>
        </div>

        <select
          className="form-select w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading report...</div>
      ) : reportData ? (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Total House Owners</small>
                <h4 className="fw-bold mt-2">{reportData.house_owner_count}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Total Staff</small>
                <h4 className="fw-bold mt-2">{reportData.staff_count}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Total Jobs</small>
                <h4 className="fw-bold mt-2">{reportData.job_count}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Membership Revenue</small>
                <h4 className="fw-bold mt-2">{formatCurrency(reportData.member_subscription_revenue)}</h4>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-7">
              <div className="card p-4 h-100" style={cardStyle}>
                <h6 className="fw-bold mb-3">
                  {filter === "monthly" ? "Monthly Revenue Overview" : "Yearly Revenue Overview"}
                </h6>
                <Bar
                  data={revenueChartData}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card p-4 h-100" style={cardStyle}>
                <h6 className="fw-bold mb-3">Job Posting Report</h6>
                <div style={{ width: "100%", height: 260, display: "flex", justifyContent: "center", margin: "0 auto" }}>
                  <Doughnut
                    data={jobPostingChartData}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                  />
                </div>
                <div className="row text-center mt-4 g-3">
                  <div className="col-6">
                    <div className="border rounded-3 p-2 bg-light">
                      <small className="text-muted d-block">Open Jobs</small>
                      <strong>{jobStatusOverview.open || 0}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded-3 p-2 bg-light">
                      <small className="text-muted d-block">Pending Jobs</small>
                      <strong>{jobStatusOverview.pending || 0}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded-3 p-2 bg-light">
                      <small className="text-muted d-block">Closed Jobs</small>
                      <strong>{jobStatusOverview.closed || 0}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded-3 p-2 bg-light">
                      <small className="text-muted d-block">Paused Jobs</small>
                      <strong>{jobStatusOverview.paused || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card p-4 h-100" style={cardStyle}>
                <h6 className="fw-bold mb-3">Hiring Report</h6>
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="border rounded-3 p-3 bg-light">
                      <small className="text-muted d-block">Total Applications</small>
                      <strong>{hiringReport.total_applications || 0}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded-3 p-3 bg-light">
                      <small className="text-muted d-block">Conversion Rate</small>
                      <strong>{Number(hiringReport.conversion_rate || 0).toFixed(2)}%</strong>
                    </div>
                  </div>
                </div>
                <Bar
                  data={hiringChartData}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card p-4 h-100" style={cardStyle}>
                <h6 className="fw-bold mb-3">Top Job Posting Reports</h6>
                {topJobPostings.length === 0 ? (
                  <div className="text-muted">No job posting data available.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Job Title</th>
                          <th>City</th>
                          <th>Status</th>
                          <th className="text-end">Applications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topJobPostings.map((job) => (
                          <tr key={job.id}>
                            <td className="fw-semibold">{job.title}</td>
                            <td>{job.city || "-"}</td>
                            <td className="text-capitalize">{job.status || "-"}</td>
                            <td className="text-end fw-bold">{job.applications_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Salary Paid</small>
                <h5 className="fw-bold mt-2">{formatCurrency(reportData.member_salary_paid)}</h5>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Present Attendance</small>
                <h5 className="fw-bold mt-2">{reportData.present_attendance_count}</h5>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-3" style={cardStyle}>
                <small className="text-muted">Overall Attendance Rate</small>
                <h5 className="fw-bold mt-2">{reportData.overall_attendance_rate}%</h5>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-5">No data available</div>
      )}
    </div>
  );
};

export default Reports;
