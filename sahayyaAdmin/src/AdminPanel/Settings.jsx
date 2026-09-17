import React, { useState, useEffect } from "react";
import axiosInstance from "../utiles/axiosInstance";

const Settings = () => {

  const [points, setPoints] = useState("");
  const [ratio, setRatio] = useState("");
  const [creditsPerJobApplication, setCreditsPerJobApplication] = useState("5");
  const [pointsPerStaffReferral, setPointsPerStaffReferral] = useState("10");
  const [staffReferralPointsPerCredit, setStaffReferralPointsPerCredit] = useState("10");
  const [creditPurchasePrice, setCreditPurchasePrice] = useState("10");
  const [referralNewUserBonus, setReferralNewUserBonus] = useState("10");


  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const referralCreditExample = Math.floor(
    Number(pointsPerStaffReferral || 0) /
      Math.max(1, Number(staffReferralPointsPerCredit || 1))
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get("/admin/settings");
      if (res.data?.success) {
        const settings = res.data.data;
        const pointsSetting = settings.find(s => s.key === "points_per_action");
        const ratioSetting = settings.find(s => s.key === "point_to_inr_ratio");
        const creditsPerJob = settings.find(s => s.key === "credits_per_job_application");
        const legacyCreditsPerReferral = settings.find(s => s.key === "credits_per_staff_referral");
        const staffReferralPoints = settings.find(s => s.key === "points_per_staff_referral");
        const referralPointsPerCredit = settings.find(s => s.key === "staff_referral_points_per_credit");
        const creditPrice = settings.find(s => s.key === "credit_purchase_price");
        if (pointsSetting) setPoints(pointsSetting.value);
        if (ratioSetting) setRatio(ratioSetting.value);
        if (creditsPerJob) setCreditsPerJobApplication(creditsPerJob.value);
        setPointsPerStaffReferral(
          staffReferralPoints?.value || legacyCreditsPerReferral?.value || "10"
        );
        if (referralPointsPerCredit) {
          setStaffReferralPointsPerCredit(referralPointsPerCredit.value);
        }
        if (creditPrice) setCreditPurchasePrice(creditPrice.value);
        const newUserBonus = settings.find(s => s.key === "referral_new_user_bonus");
        if (newUserBonus) setReferralNewUserBonus(newUserBonus.value);
      }
    } catch (error) {
      console.log("Failed to load settings", error);
    }
  };

  // =========================
  // SUBMIT SETTINGS
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate credit settings
    const cpJob = parseInt(creditsPerJobApplication, 10);
    const referralPoints = parseInt(pointsPerStaffReferral, 10);
    const exchangePoints = parseInt(staffReferralPointsPerCredit, 10);
    const cpPrice = parseFloat(creditPurchasePrice);

    if (isNaN(cpJob) || cpJob < 1) {
      setMessage("Credits per job application must be at least 1");
      return;
    }
    if (isNaN(referralPoints) || referralPoints < 1) {
      setMessage("Points per staff referral must be at least 1");
      return;
    }
    if (isNaN(exchangePoints) || exchangePoints < 1) {
      setMessage("Points required per credit must be at least 1");
      return;
    }
    if (isNaN(cpPrice) || cpPrice <= 0) {
      setMessage("Credit purchase price must be greater than 0");
      return;
    }

    const newUserBonus = parseInt(referralNewUserBonus, 10);
    if (isNaN(newUserBonus) || newUserBonus < 0) {
      setMessage("Referral new user bonus must be 0 or more");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        settings: [
          {
            key: "points_per_action",
            value: points
          },
          {
            key: "point_to_inr_ratio",
            value: ratio
          },
          {
            key: "credits_per_job_application",
            value: creditsPerJobApplication
          },
          {
            key: "points_per_staff_referral",
            value: pointsPerStaffReferral,
            title: "Points Per Staff Referral",
            description: "Points awarded per successful staff referral"
          },
          {
            key: "staff_referral_points_per_credit",
            value: staffReferralPointsPerCredit,
            title: "Staff Referral Points Per Credit",
            description: "Referral points required to redeem one job credit"
          },
          {
            key: "credit_purchase_price",
            value: creditPurchasePrice
          },
          {
            key: "referral_new_user_bonus",
            value: referralNewUserBonus
          }
        ]
      };

      const res = await axiosInstance.post(
        "/admin/settings/store",
        payload
      );

      if (res.data) {
        setMessage("Settings updated successfully!");
      }

    } catch (error) {
      console.log(error);
      setMessage(error?.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>

      {/* HEADER */}
      <div className="mb-4">
        <h2 className="fw-bold">Settings</h2>
      </div>

      {/* CARD */}
      <div className="card p-4" style={{ maxWidth: "500px" }}>

        <form onSubmit={handleSubmit}>

          {/* INPUT 1 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Points Per Referral Invite
            </label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 10"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
            />
          </div>

          {/* INPUT 2 */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              1 Point = How many INR?
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 1 or 0.5"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              required
            />
            <small className="text-muted">If a user earns 10 points and this is 1, they get ₹10 discount. If this is 0.5, they get ₹5 discount.</small>
          </div>

          <hr className="my-4" />
          <h6 className="fw-bold mb-3">Credit System (Staff Job Applications)</h6>

          {/* CREDIT INPUT 1 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Credits Per Job Application
            </label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 5"
              value={creditsPerJobApplication}
              onChange={(e) => setCreditsPerJobApplication(e.target.value)}
              required
            />
            <small className="text-muted">Credits deducted when a staff member applies for a job.</small>
          </div>

          {/* REFERRAL POINT INPUT */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Points Per Successful Staff Referral
            </label>
            <input
              type="number"
              min="1"
              className="form-control"
              placeholder="e.g. 10"
              value={pointsPerStaffReferral}
              onChange={(e) => setPointsPerStaffReferral(e.target.value)}
              required
            />
            <small className="text-muted">
              Reward points earned when a referral is completed. Credits are added only after the staff member redeems these points.
            </small>
          </div>

          {/* REFERRAL EXCHANGE INPUT */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Points Required for 1 Credit
            </label>
            <input
              type="number"
              min="1"
              className="form-control"
              placeholder="e.g. 10"
              value={staffReferralPointsPerCredit}
              onChange={(e) => setStaffReferralPointsPerCredit(e.target.value)}
              required
            />
            <small className="text-muted">
              At the current values, one successful referral can redeem {referralCreditExample} job credit{referralCreditExample === 1 ? "" : "s"}. Incomplete points remain available for later redemption.
            </small>
          </div>

          {/* REFERRAL NEW USER BONUS */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Referral Signup Bonus (New User)
            </label>
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="e.g. 10"
              value={referralNewUserBonus}
              onChange={(e) => setReferralNewUserBonus(e.target.value)}
              required
            />
            <small className="text-muted">
              Credits given directly to new user's wallet when they register using a referral code. Both parties get rewarded.
            </small>
          </div>

          {/* CREDIT PURCHASE INPUT */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Credit Purchase Price (INR per credit)
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 10"
              value={creditPurchasePrice}
              onChange={(e) => setCreditPurchasePrice(e.target.value)}
              required
            />
            <small className="text-muted">Price staff pays in INR to purchase 1 credit via Razorpay.</small>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>

        </form>

        {/* MESSAGE */}
        {message && (
          <div className="mt-3 text-center fw-semibold">
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
