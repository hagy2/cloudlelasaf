import React, { useState, useEffect, useCallback } from "react";
import { fetchAuthSession, getCurrentUser } from "@aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import PinkNavbar from '../components/navbar';
const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    status: "pending",
  });
  const navigate = useNavigate();

  // Replace with your actual API Gateway URLs
  const API_BASE_URL =
    "https://m7ucuqnlaf.execute-api.us-east-1.amazonaws.com/dev";

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (error) {
      console.log("User not authenticated:", error);
      setUser(null);
      navigate("/signin");
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  // Get JWT token for API requests
  const getAuthToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      console.log("DEBUG: Auth Token:", token); // Debug log
      if (!token) {
        throw new Error("No valid token found");
      }
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      setError("Authentication failed. Please sign in again.");
      navigate("/signin");
      return null;
    }
  }, [navigate]);

  // Fetch all tasks with authentication
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("Session expired. Please sign in again.");
        navigate("/signin");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();

      if (result.tasks) {
        setTasks(Array.isArray(result.tasks) ? result.tasks : []);

        if (result.tasks && Array.isArray(result.tasks)) {
          result.tasks.forEach((task, index) => {
            if (task.file_url) {
              console.log(
                `Task ${index + 1} (${task.title}) - File URL:`,
                task.file_url
              );
              console.log(`File Name: ${task.file_name}`);
              console.log("---");
            }
          });
        }
      } else {
        throw new Error(result.error || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(`Failed to load tasks: ${error.message}`);
      if (
        error.message.includes("401") ||
        error.message.includes("Authentication")
      ) {
        navigate("/signin");
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate, getAuthToken]);

  // Create new task with authentication
  const createTask = useCallback(async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in both title and description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) return;

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      // Handle file upload
      if (selectedFile) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > maxSize) {
          setError("File size must be less than 10MB");
          return;
        }

        const reader = new FileReader();
        const fileDataPromise = new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(selectedFile);
        });

        try {
          const fileData = await fileDataPromise;
          payload.file = fileData;
          payload.filename = selectedFile.name;
        } catch (fileError) {
          setError("Failed to process file. Please try again.");
          return;
        }
      }

      console.log("DEBUG: Payload being sent to backend:", payload);

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setError("Session expired. Please sign in again.");
        navigate("/signin");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      if (result.success) {
        setFormData({ title: "", description: "", status: "pending" });
        setSelectedFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
        await fetchTasks();
        setError(null);
        alert("Task created successfully!");
      } else {
        throw new Error(result.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      setError(`Failed to create task: ${error.message}`);
      if (
        error.message.includes("401") ||
        error.message.includes("Authentication")
      ) {
        navigate("/signin");
      }
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    selectedFile,
    getAuthToken,
    API_BASE_URL,
    navigate,
    fetchTasks,
  ]);

  // Update task
  const updateTask = useCallback(
    async (taskId) => {
      if (!editFormData.title.trim() || !editFormData.description.trim()) {
        setError("Please fill in both title and description");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        if (!token) return;

        const payload = {
          title: editFormData.title.trim(),
          description: editFormData.description.trim(),
          status: editFormData.status,
        };

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          setError("Session expired. Please sign in again.");
          navigate("/signin");
          return;
        }

        if (response.status === 403) {
          setError("You are not authorized to update this task.");
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        setEditingTask(null);
        setEditFormData({ title: "", description: "", status: "pending" });
        await fetchTasks();
        setError(null);
        alert("Task updated successfully!");
      } catch (error) {
        console.error("Error updating task:", error);
        setError(`Failed to update task: ${error.message}`);
        if (
          error.message.includes("401") ||
          error.message.includes("Authentication")
        ) {
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    },
    [editFormData, getAuthToken, API_BASE_URL, navigate, fetchTasks]
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId, taskTitle) => {
      if (!window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          setError("Session expired. Please sign in again.");
          navigate("/signin");
          return;
        }

        if (response.status === 403) {
          setError("You are not authorized to delete this task.");
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        await fetchTasks();
        setError(null);
        alert("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
        setError(`Failed to delete task: ${error.message}`);
        if (
          error.message.includes("401") ||
          error.message.includes("Authentication")
        ) {
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken, API_BASE_URL, navigate, fetchTasks]
  );

  // Handle file selection with validation
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  // Start editing a task
  const startEditTask = (task) => {
    setEditingTask(task.task_id);
    setEditFormData({
      title: task.title,
      description: task.description,
      status: task.status,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTask(null);
    setEditFormData({ title: "", description: "", status: "pending" });
  };

  // Load auth status and tasks on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchTasks();
    }
  }, [user, authLoading, fetchTasks]);

  // Show loading screen while checking authentication
  if (authLoading) {

    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <div>
          <h2>Loading...</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <div>
          <h2>Authentication Required</h2>
          <p>Please sign in to access the Task Management System.</p>
          <button
            onClick={() => navigate("/signin")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PinkNavbar />
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          fontFamily: '"Comic Sans MS","Segoe UI",cursive',
          backgroundColor: "#fff0f6",
          borderRadius: "20px",
        }}
      >
        {/* 🌸 Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            padding: "18px 22px",
            background: "linear-gradient(90deg,#ff9a9e,#fad0c4)",
            borderRadius: "15px",
            boxShadow: "0 4px 12px rgba(255,182,193,.35)",
            color: "#fff",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "28px" }}>🎀 Task Manager</h1>
            <p style={{ margin: "6px 0 0 0", fontSize: "14px" }}>
              Welcome, <strong>{user?.username || user?.email || "Cutie"}</strong>! 💖
            </p>
          </div>
          <button
            onClick={() => navigate("/signout")}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(90deg,#ff6f91,#ff9472)",
              border: "none",
              borderRadius: "30px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 3px 8px rgba(255,105,135,.4)",
            }}
          >
            🚪 Sign Out
          </button>
        </div>

        {/* 🚨 Error Display */}
        {error && (
          <div
            style={{
              position: "relative",
              padding: "15px 20px",
              marginBottom: "20px",
              backgroundColor: "#ffe5e9",
              border: "2px solid #ffb3c1",
              borderRadius: "12px",
              color: "#d62857",
              fontWeight: "600",
            }}
          >
            ❌ {error}
            <button
              onClick={() => setError(null)}
              style={{
                position: "absolute",
                top: "8px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "20px",
                lineHeight: 1,
                cursor: "pointer",
                color: "#d62857",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ✨ Create Task */}
        <div
          style={{
            border: "2px dashed #ffc0cb",
            padding: "25px",
            marginBottom: "30px",
            borderRadius: "15px",
            backgroundColor: "#fffafd",
            boxShadow: "0 3px 10px rgba(255,192,203,.25)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#e75480" }}>➕ Create New Task</h2>

          {/* Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontWeight: "600" }}>Title 💕</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                border: "2px solid #ffc0cb",
                borderRadius: "10px",
              }}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontWeight: "600" }}>Description 📝</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                border: "2px solid #ffc0cb",
                borderRadius: "10px",
                resize: "vertical",
              }}
              disabled={loading}
            />
          </div>

          {/* Status */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontWeight: "600" }}>Status ✨</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                border: "2px solid #ffc0cb",
                borderRadius: "10px",
                backgroundColor: "#fffafd",
              }}
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* File */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontWeight: "600" }}>Attach File (optional) 📎</label>
            <input
              type="file"
              onChange={handleFileSelect}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                border: "2px solid #ffc0cb",
                borderRadius: "10px",
                backgroundColor: "#fffafd",
              }}
              disabled={loading}
            />
            {selectedFile && (
              <p style={{ fontSize: "12px", marginTop: "6px", color: "#666" }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Create Button */}
          <button
            onClick={createTask}
            disabled={loading || !formData.title.trim() || !formData.description.trim()}
            style={{
              padding: "12px 30px",
              background: loading
                ? "#ffc9d6"
                : "linear-gradient(90deg,#ffb6c1,#ffc0cb)",
              border: "none",
              borderRadius: "30px",
              color: "#fff",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 3px 8px rgba(255,182,193,.35)",
            }}
          >
            {loading ? "Creating…" : "🌟 Create Task"}
          </button>
        </div>

        {/* 📋 Task List */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ margin: 0, color: "#e75480" }}>
              🗂️ Your Tasks ({tasks.length})
            </h2>
            <button
              onClick={fetchTasks}
              disabled={loading}
              style={{
                padding: "8px 20px",
                background: loading
                  ? "#ffc9d6"
                  : "linear-gradient(90deg,#ff9a9e,#fad0c4)",
                border: "none",
                borderRadius: "25px",
                color: "#fff",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 3px 8px rgba(255,182,193,.35)",
              }}
            >
              {loading ? "Loading…" : "🔄 Refresh"}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px" }}>
              <p>Loading tasks…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px",
                backgroundColor: "#fffafd",
                borderRadius: "15px",
                border: "2px dashed #ffc0cb",
              }}
            >
              <h3 style={{ color: "#e75480", margin: "0 0 10px 0" }}>
                No tasks yet
              </h3>
              <p style={{ margin: 0 }}>Create a task above to get started! 🌱</p>
            </div>
          ) : (
            /* ----- tasks grid ----- */
            <div style={{ display: "grid", gap: "18px" }}>
              {tasks.map((task) => (
                <div
                  key={task.task_id}
                  style={{
                    border: "2px solid #ffc0cb",
                    borderRadius: "15px",
                    padding: "22px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 3px 8px rgba(255,182,193,.25)",
                  }}
                >
                  {editingTask === task.task_id ? (
                    /* -------- Edit Mode -------- */
                    <>
                      <h3 style={{ margin: "0 0 15px 0", color: "#e75480" }}>
                        ✏️ Edit Task
                      </h3>

                      {/* title */}
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontWeight: "600" }}>Title 💕</label>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              title: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "6px",
                            border: "2px solid #ffc0cb",
                            borderRadius: "10px",
                          }}
                          disabled={loading}
                        />
                      </div>

                      {/* description */}
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontWeight: "600" }}>
                          Description 📝
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              description: e.target.value,
                            })
                          }
                          rows="3"
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "6px",
                            border: "2px solid #ffc0cb",
                            borderRadius: "10px",
                          }}
                          disabled={loading}
                        />
                      </div>

                      {/* status */}
                      <div style={{ marginBottom: "18px" }}>
                        <label style={{ fontWeight: "600" }}>Status ✨</label>
                        <select
                          value={editFormData.status}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              status: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "6px",
                            border: "2px solid #ffc0cb",
                            borderRadius: "10px",
                            backgroundColor: "#fffafd",
                          }}
                          disabled={loading}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      {/* action buttons */}
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => updateTask(task.task_id)}
                          disabled={
                            loading ||
                            !editFormData.title.trim() ||
                            !editFormData.description.trim()
                          }
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            background:
                              loading ||
                              !editFormData.title.trim() ||
                              !editFormData.description.trim()
                                ? "#ffc9d6"
                                : "linear-gradient(90deg,#ffb6c1,#ffc0cb)",
                            border: "none",
                            borderRadius: "30px",
                            color: "#fff",
                            fontWeight: "bold",
                            cursor:
                              loading ||
                              !editFormData.title.trim() ||
                              !editFormData.description.trim()
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {loading ? "Saving…" : "💾 Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            background: "#d8d8d8",
                            border: "none",
                            borderRadius: "30px",
                            color: "#555",
                            fontWeight: "bold",
                            cursor: loading ? "not-allowed" : "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    /* -------- Display Mode -------- */
                    <>
                      <h3 style={{ margin: "0 0 10px 0", color: "#e75480" }}>
                        {task.title}
                      </h3>
                      <p
                        style={{
                          margin: "0 0 15px 0",
                          color: "#666",
                          lineHeight: "1.6",
                        }}
                      >
                        {task.description}
                      </p>

                      {/* meta */}
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                          fontSize: "13px",
                          color: "#888",
                          flexWrap: "wrap",
                          marginBottom: "18px",
                        }}
                      >
                        <span>
                          Status:{" "}
                          <strong
                            style={{
                              color:
                                task.status === "completed"
                                  ? "#28a745"
                                  : task.status === "in-progress"
                                  ? "#ffc107"
                                  : "#6c757d",
                            }}
                          >
                            {task.status}
                          </strong>
                        </span>
                        <span>
                          Created:{" "}
                          {task.created_at
                            ? new Date(task.created_at).toLocaleDateString()
                            : "Unknown"}
                        </span>
                        <span>
                          ID: {task.task_id.slice(0, 8)}…
                        </span>
                      </div>

                      {/* display & action buttons */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "20px",
                        }}
                      >
                        {/* left → buttons */}
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => startEditTask(task)}
                            disabled={loading}
                            style={{
                              padding: "6px 14px",
                              background:
                                "linear-gradient(90deg,#bface2,#e9defa)",
                              border: "none",
                              borderRadius: "25px",
                              color: "#6a4ba3",
                              fontWeight: "600",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteTask(task.task_id, task.title)}
                            disabled={loading}
                            style={{
                              padding: "6px 14px",
                              background:
                                "linear-gradient(90deg,#ff7c89,#ffb199)",
                              border: "none",
                              borderRadius: "25px",
                              color: "#fff",
                              fontWeight: "600",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontSize: "14px",
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>

                        {/* right → attachment preview */}
                        {task.file_url && task.file_name && (
                          <div
                            style={{
                              padding: "12px 16px",
                              backgroundColor: "#ffeef2",
                              borderRadius: "10px",
                              textAlign: "center",
                              border: "2px dashed #ffc0cb",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 8px 0",
                                fontSize: "12px",
                                color: "#d6336c",
                                fontWeight: "600",
                              }}
                            >
                              📎 Attachment:
                            </p>
                            <a
                              href={task.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#d6336c",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "600",
                                wordBreak: "break-all",
                              }}
                            >
                              {task.file_name}
                            </a>
                            <p
                              style={{
                                margin: "8px 0 0 0",
                                fontSize: "10px",
                                color: "#adadad",
                              }}
                            >
                              (valid 7 days)
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔒 Security Notice */}
        <div
          style={{
            marginTop: "35px",
            padding: "18px 22px",
            backgroundColor: "#e9f7ef",
            border: "2px solid #c3e6cb",
            borderRadius: "15px",
            color: "#155724",
            fontWeight: "600",
          }}
        >
          🔒 This Task Manager is secured with AWS Cognito. Only authenticated
          users can create, view, edit, and delete tasks.
        </div>
      </div>
    </>
  );
};

export default TaskManager;