import React from "react";

const Unauthorized = () => {
  return (
    <div className="container-fluid p-4">
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
        <h2 className="fw-bold mb-2">Access Restricted</h2>
        <p className="text-muted mb-0">
          You do not have permission to open this admin module.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
