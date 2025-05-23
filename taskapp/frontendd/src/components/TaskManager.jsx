import React, { useState, useEffect } from "react";

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Replace with your actual API Gateway URLs
  const API_BASE_URL =
    "https://plxbn1g54e.execute-api.us-east-1.amazonaws.com/dev";

  // Fetch all tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setTasks(result.data || []);

        // Print file URLs to console for debugging
        result.data?.forEach((task, index) => {
          if (task.fileUrl) {
            console.log(
              `Task ${index + 1} (${task.title}) - File URL:`,
              task.fileUrl
            );
            console.log(`File Name: ${task.fileName}`);
            console.log("---");
          }
        });
      } else {
        console.error("Failed to fetch tasks:", result.error);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create new task
  const createTask = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in both title and description");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
      };

      // Handle file upload
      if (selectedFile) {
        const reader = new FileReader();
        const fileDataPromise = new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(selectedFile);
        });

        const fileData = await fileDataPromise;
        payload.file = fileData;
        payload.filename = selectedFile.name;
      }

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setFormData({ title: "", description: "", status: "pending" });
        setSelectedFile(null);

        // Print the created task's file URL to console
        if (result.data && result.data.fileUrl) {
          console.log("=== NEW TASK CREATED ===");
          console.log("Task ID:", result.data.taskId);
          console.log("File URL:", result.data.fileUrl);
          console.log("File Name:", result.data.fileName);
          console.log("S3 Key:", result.data.s3Key);
          console.log("========================");
        }

        fetchTasks(); // Refresh the list
        alert("Task created successfully!");
      } else {
        alert("Failed to create task: " + result.error);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Task Management System</h1>

      {/* Create Task Section */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2>Create New Task</h2>

        <div style={{ marginBottom: "10px" }}>
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows="4"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Status:</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Attach File (optional):</label>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          {selectedFile && (
            <p style={{ fontSize: "12px", color: "#666" }}>
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <button
          onClick={createTask}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </div>

      {/* Tasks List */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Tasks ({tasks.length})</h2>
          <button
            onClick={fetchTasks}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks found. Create your first task above!</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {tasks.map((task) => (
              <div
                key={task.taskId}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  padding: "15px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
                      {task.title}
                    </h3>
                    <p style={{ margin: "0 0 10px 0", color: "#666" }}>
                      {task.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        fontSize: "14px",
                        color: "#888",
                      }}
                    >
                      <span>
                        Status: <strong>{task.status}</strong>
                      </span>
                      <span>
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      <span>ID: {task.taskId.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {task.fileUrl && task.fileName && (
                    <div style={{ marginLeft: "15px" }}>
                      <div
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#e9ecef",
                          borderRadius: "4px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          Attachment:
                        </p>
                        <a
                          href={task.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            console.log("=== FILE CLICKED ===");
                            console.log("Task:", task.title);
                            console.log("File URL:", task.fileUrl);
                            console.log("File Name:", task.fileName);
                            console.log("==================");
                          }}
                          style={{
                            color: "#007bff",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          📎 {task.fileName}
                        </a>
                        <p
                          style={{
                            margin: "5px 0 0 0",
                            fontSize: "10px",
                            color: "#999",
                          }}
                        >
                          (Signed URL - 1h validity)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Configuration Notice */}
      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "5px",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>⚠️ Configuration Required</h4>
        <p style={{ margin: "0", fontSize: "14px" }}>
          Update the <code>API_BASE_URL</code> constant in the code with your
          actual API Gateway URL.
          <br />
          Current: <code>{API_BASE_URL}</code>
        </p>
      </div>
    </div>
  );
};

export default TaskManager;
