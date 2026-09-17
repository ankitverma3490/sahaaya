import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../utiles/axiosInstance";
import { getDefaultAdminRoute } from "../utiles/adminPermissions";

const MainLogin = () => {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        toast.dismiss();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            const res = await axiosInstance.post("/admin/login", {
                email,
                password
            });

            if (res.data?.status === "success") {

                const token = res.data.token;
                const user = res.data.user;

                localStorage.setItem("token", token);
                localStorage.setItem("login_details", JSON.stringify(user));
                localStorage.setItem("user_id", user.id);
                localStorage.setItem("role", user.role || "Admin");

                toast.success(res.data.msg);

                setTimeout(() => {
                    navigate(getDefaultAdminRoute());
                }, 1200);
            }

        } catch (error) {

            toast.error(
                error?.response?.data?.msg ||
                "Login failed"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            <div className="login-right-panel">
                <div className="login-form-box">
                    <h2 className="login-form-title">Login</h2>

                    <form className="login-form mt-4" onSubmit={handleLogin}>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login Now"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default MainLogin;
