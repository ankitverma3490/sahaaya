import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const TrainingVideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/training-videos");
      if (res?.data?.status) setVideos(res.data.data || []);
    } catch {
      toast.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setVideoUrl("");
    setVideoFile(null);
    setVideoFileName("");
    setSortOrder(0);
    setIsActive(true);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["video/mp4", "video/avi", "video/mov", "video/quicktime"];
      if (!allowedTypes.includes(file.type)) {
        toast.warning("Only MP4, AVI, MOV files are allowed");
        return;
      }
      // Validate 50MB max
      if (file.size > 50 * 1024 * 1024) {
        toast.warning("File size must be under 50MB");
        return;
      }
      setVideoFile(file);
      setVideoFileName(file.name);
      setVideoUrl(""); // Clear URL when file is selected
    }
  };

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
    if (e.target.value) {
      setVideoFile(null);
      setVideoFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.warning("Title is required");
      return;
    }
    if (!videoUrl.trim() && !videoFile) {
      toast.warning("Please provide either a video URL or upload a video file");
      return;
    }
    if (videoUrl.trim()) {
      try {
        new URL(videoUrl);
      } catch {
        toast.warning("Please enter a valid URL");
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (subtitle.trim()) formData.append("subtitle", subtitle.trim());
      if (videoUrl.trim()) formData.append("video_url", videoUrl.trim());
      if (videoFile) formData.append("video_file", videoFile);
      formData.append("sort_order", parseInt(sortOrder) || 0);
      formData.append("is_active", isActive);

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };

      if (editingId) {
        await axiosInstance.post(
          `/admin/training-videos/${editingId}`,
          formData,
          config
        );
        toast.success("Video updated successfully");
      } else {
        await axiosInstance.post("/admin/training-videos", formData, config);
        toast.success("Video added successfully");
      }
      resetForm();
      fetchVideos();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (video) => {
    setEditingId(video.id);
    setTitle(video.title || "");
    setSubtitle(video.subtitle || "");
    setVideoUrl(video.video_url || "");
    setVideoFile(null);
    setVideoFileName(video.video_file || "");
    setSortOrder(video.sort_order || 0);
    setIsActive(video.is_active !== false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete video "${name}"?`)) return;
    try {
      await axiosInstance.delete(`/admin/training-videos/${id}`);
      toast.success("Video deleted");
      fetchVideos();
    } catch {
      toast.error("Failed to delete video");
    }
  };

  const handleToggleActive = async (video) => {
    try {
      await axiosInstance.post(`/admin/training-videos/${video.id}`, {
        is_active: !video.is_active,
      });
      toast.success(video.is_active ? "Video deactivated" : "Video activated");
      fetchVideos();
    } catch {
      toast.error("Failed to update video");
    }
  };

  const getVideoSource = (video) => {
    if (video.video_file) {
      const baseUrl = (axiosInstance.defaults?.baseURL || "").replace(/\/api\/?$/, "");
      return `${baseUrl}/storage/videos/${video.video_file}`;
    }
    return video.video_url;
  };

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>
      <h2 className="fw-bold mb-4">Training Video Management</h2>

      <div className="row">
        {/* Form */}
        <div className="col-lg-5 mb-4">
          <div className="card p-4 shadow-sm">
            <h5 className="fw-bold mb-3">
              {editingId ? "Edit Video" : "Add New Video"}
            </h5>

            <div className="mb-3">
              <label className="form-label fw-semibold">Title *</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Getting Started"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Subtitle</label>
              <input
                className="form-control"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. How to Navigate the App"
              />
            </div>

            {/* Video URL */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Video URL</label>
              <input
                className="form-control"
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder="YouTube, Vimeo, or direct MP4 URL"
                disabled={!!videoFile}
              />
              <div className="form-text">
                YouTube, Vimeo, or direct .mp4 links
              </div>
            </div>

            <div className="text-center my-2">
              <span className="text-muted fw-semibold">— OR —</span>
            </div>

            {/* File Upload */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Upload Video File</label>
              <input
                ref={fileInputRef}
                className="form-control"
                type="file"
                accept="video/mp4,video/quicktime,video/m4v"
                onChange={handleFileChange}
                disabled={!!videoUrl.trim()}
              />
              {videoFileName && (
                <div className="form-text text-success">
                  Selected: {videoFileName}
                </div>
              )}
              <div className="form-text">
                Max 50MB — MP4 / MOV / M4V formats only
              </div>
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label fw-semibold">Sort Order</label>
                <input
                  className="form-control"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label fw-semibold">Status</label>
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isActive}
                    onChange={() => setIsActive(!isActive)}
                    id="activeSwitch"
                  />
                  <label className="form-check-label" htmlFor="activeSwitch">
                    {isActive ? "Active" : "Inactive"}
                  </label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn sahayya-btn-primary px-4"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving…
                  </>
                ) : editingId ? (
                  "Update Video"
                ) : (
                  "Add Video"
                )}
              </button>
              {editingId && (
                <button className="btn btn-light" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="col-lg-7">
          <div className="card p-0 shadow-sm">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" />
              </div>
            ) : (
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Title</th>
                    <th>Source</th>
                    <th style={{ width: 60 }}>Order</th>
                    <th style={{ width: 70 }}>Status</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-5">
                        No videos yet. Add one using the form.
                      </td>
                    </tr>
                  )}
                  {videos.map((video, index) => (
                    <tr key={video.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{video.title}</strong>
                        {video.subtitle && (
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {video.subtitle}
                          </div>
                        )}
                      </td>
                      <td>
                        {video.video_file ? (
                          <span className="badge bg-info">
                            <i className="fas fa-upload me-1" />
                            Uploaded File
                          </span>
                        ) : (
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "0.8rem",
                              wordBreak: "break-all",
                            }}
                          >
                            {video.video_url?.substring(0, 40)}…
                          </a>
                        )}
                      </td>
                      <td>{video.sort_order}</td>
                      <td>
                        <span
                          className={`badge ${
                            video.is_active ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {video.is_active ? "Active" : "Off"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleToggleActive(video)}
                            title={
                              video.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {video.is_active ? "Hide" : "Show"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(video)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              handleDelete(video.id, video.title)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingVideoManagement;
