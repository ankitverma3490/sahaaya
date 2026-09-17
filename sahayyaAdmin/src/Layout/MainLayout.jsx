import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import './Sidebar.css';
import AdminHeader from "./AdminHeader";
import Sidebar from "./Sidebar";

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);
            // On mobile, default close; on desktop, default open
            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleToggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    const handleLinkClick = () => {
        // On mobile, close sidebar after clicking a link
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="admin-layout">
            {/* Fixed Header */}
            <AdminHeader
                onToggleSidebar={handleToggleSidebar}
                sidebarOpen={sidebarOpen}
            />

            {/* Body: Sidebar + Content */}
            <div className="admin-body">
                {/* Overlay for mobile when sidebar is open */}
                {isMobile && sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-visible" : "sidebar-hidden"} ${isMobile ? "sidebar-mobile" : "sidebar-desktop"}`}>
                    <Sidebar onLinkClick={handleLinkClick} />
                </aside>

                {/* Main Content */}
                <main className={`admin-content ${sidebarOpen && !isMobile ? "content-shifted" : "content-full"}`}>
                    <div className="content-inner">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
