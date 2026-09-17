import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Users,
  Building2,
  TrendingUp,
  IndianRupee,
  Briefcase,
  FileText,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  LayoutDashboard,
} from "lucide-react";

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  PointElement, LineElement, Filler
);

/* ─── helpers ─── */
const fmt = (n) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtCurrency = (n) =>
  "INR " +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── brand ─── */
const C = {
  primary:   "#D98579",
  accent:    "#E8A99E",
  bg:        "#f4f6f9",
  white:     "#ffffff",
  border:    "#e8edf2",
  textMain:  "#1a1a2e",
  textSub:   "#6b7280",
  textLight: "#9ca3af",
  green100:  "#FFF5F3",
  green200:  "#FFE8E4",
};

/* ─── line chart base options ─── */
const lineOptions = (isCurrency) => ({
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: C.primary,
      titleColor: "rgba(255,255,255,0.7)",
      bodyColor: "#fff",
      padding: 12,
      borderColor: C.accent,
      borderWidth: 1,
      callbacks: {
        label: (ctx) =>
          isCurrency
            ? "  " + fmtCurrency(ctx.parsed.y)
            : "  " + fmt(ctx.parsed.y) + " users",
      },
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: { color: C.textSub, font: { size: 11, family: "Inter" } },
    },
    y: {
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: {
        color: C.textSub,
        font: { size: 11, family: "Inter" },
        callback: (v) => (isCurrency ? "₹" + fmt(v) : fmt(v)),
      },
    },
  },
});

/* ─── StatCard ─── */
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div style={s.statCard}>
    <div style={{ ...s.statIconWrap, background: accent + "18", color: accent }}>
      <Icon size={22} strokeWidth={2} />
    </div>
    <div style={s.statValue}>{value}</div>
    <div style={s.statLabel}>{label}</div>
    <div style={s.statSub}>{sub}</div>
  </div>
);

/* ─── InfoBox ─── */
const InfoBox = ({ icon: Icon, value, label, color }) => (
  <div style={{ ...s.infoBox, borderLeft: `4px solid ${color}` }}>
    <div style={{ ...s.infoIconWrap, color, background: color + "15" }}>
      <Icon size={18} strokeWidth={2} />
    </div>
    <div style={s.infoNum}>{value}</div>
    <div style={s.infoName}>{label}</div>
  </div>
);

/* ─── Component ─── */
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/dashbord-data");
      if (res?.data?.status) setDashboardData(res.data.data);
    } catch (err) {
      toast.error("Dashboard load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={s.spinner} />
          <p style={{ color: C.textSub, marginTop: 14, fontSize: 14 }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const stats = dashboardData.overall_stats;

  /* ── User Growth ── */
  const ugLabels = Object.keys(dashboardData.user_month_growth);
  const ugData   = ugLabels.map((k) => dashboardData.user_month_growth[k].total);
  const userChart = {
    labels: ugLabels,
    datasets: [{
      data: ugData,
      borderColor: C.primary,
      backgroundColor: C.primary + "18",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: C.primary,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  /* ── Revenue ── */
  const rvLabels = Object.keys(dashboardData.revenue_month_growth);
  const rvData   = rvLabels.map((k) =>
    parseFloat(dashboardData.revenue_month_growth[k].total_revenue)
  );
  const revenueChart = {
    labels: rvLabels,
    datasets: [{
      data: rvData,
      borderColor: C.accent,
      backgroundColor: C.accent + "18",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: C.accent,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  /* ── Donut ── */
  const { free_users, paid_users } = dashboardData.subscription_breakdown;
  const total   = (free_users + paid_users) || 1;
  const paidPct = ((paid_users / total) * 100).toFixed(1);
  const donutChart = {
    labels: ["Free Users", "Paid Users"],
    datasets: [{
      data: [free_users, paid_users],
      backgroundColor: [C.border, C.accent],
      borderColor:     [C.white,  C.white],
      borderWidth: 3,
      hoverOffset: 5,
    }],
  };
  const donutOptions = {
    responsive: true,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: C.textMain, padding: 18, font: { size: 12, family: "Inter" } },
      },
      tooltip: {
        backgroundColor: C.primary,
        titleColor: "rgba(255,255,255,0.7)",
        bodyColor: "#fff",
        padding: 12,
        callbacks: {
          label: (ctx) =>
            ` ${fmt(ctx.parsed)} users (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  };

  return (
    <>
      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={s.headerIconWrap}>
              <LayoutDashboard size={20} color={C.primary} strokeWidth={2} />
            </div>
            <div>
              <h1 style={s.title}>Dashboard Overview</h1>
              <p style={s.subtitle}>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric",
                  month: "long",   day: "numeric",
                })}
              </p>
            </div>
          </div>
          <button style={s.refreshBtn} onClick={fetchDashboard}>
            <RefreshCw size={14} strokeWidth={2.5} />
            &nbsp; Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={s.cardGrid}>
          <StatCard icon={Users}        label="Total Staff"         value={fmt(stats.total_staff)}                       sub="Active members"       accent={C.primary} />
          <StatCard icon={Building2}    label="Total Employers"     value={fmt(stats.total_employers)}                   sub="Registered companies" accent="#7c3aed" />
          <StatCard icon={TrendingUp}   label="Active Memberships"  value={fmt(stats.active_memberships ?? 0)}           sub="Currently active"     accent="#0284c7" />
          <StatCard icon={IndianRupee}  label="Monthly Revenue"     value={fmtCurrency(stats.subscription_revenue_this_month)} sub="Subscription income" accent={C.accent} />
          <StatCard icon={ShieldCheck}  label="Pending Verifications" value={fmt(stats.pending_verifications ?? 0)}      sub="Needs review"         accent="#dc2626" />
        </div>

        {/* ── Line Charts ── */}
        <div style={s.row2}>
          {/* User Growth */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <div style={s.cardTitleRow}>
                <Users size={16} color={C.primary} strokeWidth={2} />
                <span style={s.cardTitle}>User Growth</span>
              </div>
              <span style={s.badge}>Monthly</span>
            </div>
            <div style={s.chartSummary}>
              <span style={{ ...s.bigNum, color: C.primary }}>{fmt(ugData.at(-1) ?? 0)}</span>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>users this month</span>
            </div>
            <Line data={userChart} options={lineOptions(false)} />
          </div>

          {/* Revenue Growth */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <div style={s.cardTitleRow}>
                <IndianRupee size={16} color={C.accent} strokeWidth={2} />
                <span style={s.cardTitle}>Revenue Growth</span>
              </div>
              <span style={{ ...s.badge, color: C.accent, borderColor: C.accent + "40", background: C.accent + "10" }}>Monthly</span>
            </div>
            <div style={s.chartSummary}>
              <span style={{ ...s.bigNum, color: C.accent }}>{fmtCurrency(rvData.at(-1) ?? 0)}</span>
              <span style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>this month</span>
            </div>
            <Line data={revenueChart} options={lineOptions(true)} />
          </div>
        </div>

        {/* ── Lower Row ── */}
        <div style={s.row3}>
          {/* Donut */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <div style={s.cardTitleRow}>
                <TrendingUp size={16} color={C.primary} strokeWidth={2} />
                <span style={s.cardTitle}>Subscription Breakdown</span>
              </div>
            </div>
            <div style={{ position: "relative", maxWidth: 240, margin: "0 auto" }}>
              <Doughnut data={donutChart} options={donutOptions} />
              <div style={s.donutCenter}>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.primary, lineHeight: 1 }}>{paidPct}%</div>
                <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Paid</div>
              </div>
            </div>
            <div style={s.breakdownRow}>
              <div style={s.breakdownItem}>
                <span style={{ ...s.dot, background: C.border, border: "1px solid #ccc" }} />
                <span style={{ fontSize: 12, color: C.textSub }}>Free</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.textMain, marginLeft: 4 }}>{fmt(free_users)}</span>
              </div>
              <div style={s.breakdownItem}>
                <span style={{ ...s.dot, background: C.accent }} />
                <span style={{ fontSize: 12, color: C.textSub }}>Paid</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.textMain, marginLeft: 4 }}>{fmt(paid_users)}</span>
              </div>
            </div>
          </div>

          {/* Jobs & Salary */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <div style={s.cardTitleRow}>
                <Briefcase size={16} color={C.primary} strokeWidth={2} />
                <span style={s.cardTitle}>Jobs & Salary</span>
              </div>
            </div>

            <p style={s.sectionLabel}>Job Statistics</p>
            <div style={s.infoRow}>
              <InfoBox icon={Briefcase}    value={fmt(dashboardData.job_stats.total_jobs)}               label="Total Jobs"    color={C.primary} />
              <InfoBox icon={FileText}     value={fmt(dashboardData.job_stats.total_job_applications)}   label="Applications"  color="#7c3aed" />
            </div>

            <p style={{ ...s.sectionLabel, marginTop: 18 }}>Salary Statistics</p>
            <div style={s.infoRow}>
              <InfoBox icon={Wallet}       value={fmtCurrency(dashboardData.salary_stats.total_salary_processed)} label="Total Processed" color={C.accent} />
              <InfoBox icon={CheckCircle2} value={fmt(dashboardData.salary_stats.salary_payments_done)}           label="Payments Done"   color="#0284c7" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Styles ─── */
const s = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    padding: "28px 28px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: C.textMain,
  },
  spinner: {
    width: 40, height: 40,
    border: `3px solid ${C.border}`,
    borderTop: `3px solid ${C.primary}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  /* header */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 12,
  },
  headerIconWrap: {
    width: 42, height: 42,
    borderRadius: 10,
    background: C.green100,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: `1px solid ${C.green200}`,
  },
  title: {
    fontSize: 22, fontWeight: 800,
    margin: 0, color: C.primary,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 12, color: C.textSub, margin: "3px 0 0" },
  refreshBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: C.white,
    color: C.primary,
    border: `1.5px solid ${C.green200}`,
    borderRadius: 10,
    padding: "8px 18px",
    fontSize: 13, fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(2,71,41,0.08)",
  },
  /* stat cards */
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 18,
    marginBottom: 24,
  },
  statCard: {
    background: C.white,
    borderRadius: 16,
    padding: "20px 20px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  statIconWrap: {
    width: 42, height: 42,
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  statValue: {
    fontSize: 26, fontWeight: 800,
    color: C.textMain, lineHeight: 1.1, marginBottom: 5,
  },
  statLabel: {
    fontSize: 12, fontWeight: 700,
    color: C.textSub,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 3,
  },
  statSub: { fontSize: 11, color: C.textLight },
  /* chart cards */
  row2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18, marginBottom: 24,
  },
  row3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: 18, marginBottom: 24,
  },
  card: {
    background: C.white,
    borderRadius: 16,
    padding: "20px 22px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  cardHead: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitleRow: {
    display: "flex", alignItems: "center", gap: 7,
  },
  cardTitle: {
    fontSize: 14, fontWeight: 700,
    color: C.textMain, letterSpacing: 0.1,
  },
  badge: {
    background: C.green100,
    color: C.primary,
    border: `1px solid ${C.green200}`,
    borderRadius: 20,
    padding: "2px 11px",
    fontSize: 11, fontWeight: 600,
  },
  chartSummary: {
    display: "flex", alignItems: "baseline", gap: 10,
    marginBottom: 16,
  },
  bigNum: { fontSize: 22, fontWeight: 800 },
  /* donut */
  donutCenter: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -58%)",
    textAlign: "center", pointerEvents: "none",
  },
  breakdownRow: {
    display: "flex", justifyContent: "center",
    gap: 28, marginTop: 16,
  },
  breakdownItem: { display: "flex", alignItems: "center", gap: 7 },
  dot: {
    display: "inline-block",
    width: 10, height: 10, borderRadius: "50%",
  },
  /* info boxes */
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: C.textSub,
    textTransform: "uppercase", letterSpacing: 0.6,
    margin: "0 0 10px",
  },
  infoRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
  },
  infoBox: {
    borderRadius: 12,
    padding: "16px 14px",
    background: C.bg,
    border: `1px solid ${C.border}`,
  },
  infoIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  infoNum: {
    fontSize: 15, fontWeight: 800, color: C.textMain,
    wordBreak: "break-word", lineHeight: 1.2,
  },
  infoName: {
    fontSize: 11, color: C.textSub, marginTop: 3,
    fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4,
  },
};

export default AdminDashboard;
