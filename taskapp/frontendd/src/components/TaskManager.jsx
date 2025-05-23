import React, { useState, useEffect, useCallback } from "react";
import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [file, setFile] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [loading, setLoading] = useState(true);

  // TODO: Replace with your actual API Gateway URL
  // You can find this in AWS Console > API Gateway > Your API > Stages > Invoke URL
  const API_URL =
    "https://qru2r0k7c0.execute-api.us-east-1.amazonaws.com/please";

  const fetchTasks = useCallback(
    async (token = authToken) => {
      if (!token) {
        console.error("No auth token available");
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || data.data || []);
        } else {
          console.error("Failed to fetch tasks:", response.status);
          const errorData = await response.text();
          console.error("Error details:", errorData);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    },
    [authToken, API_URL]
  );

  const initAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error("No auth token found");
      }

      setUser(currentUser);
      setAuthToken(token);
      setLoading(false);

      fetchTasks(token);
    } catch (error) {
      console.error("Auth error:", error);
      setLoading(false);
      // User is not authenticated
    }
  }, [fetchTasks]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({
          data: reader.result,
          name: selectedFile.name,
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const createTask = async () => {
    if (!title || !description) {
      alert("Please fill in title and description");
      return;
    }

    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const body = {
        title,
        description,
        status,
        file: file?.data,
        filename: file?.name,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setTitle("");
        setDescription("");
        setStatus("pending");
        setFile(null);
        const fileInput = document.getElementById("fileInput");
        if (fileInput) fileInput.value = "";
        fetchTasks();
        alert("Task created successfully!");
      } else {
        const error = await response.json();
        alert(
          "Error creating task: " +
            (error.error || error.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task: " + error.message);
    }
  };

  const updateTask = async () => {
    if (!editingTask) return;

    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${editingTask.task_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          status,
        }),
      });

      if (response.ok) {
        setEditingTask(null);
        setTitle("");
        setDescription("");
        setStatus("pending");
        fetchTasks();
        alert("Task updated successfully!");
      } else {
        const error = await response.json();
        alert(
          "Error updating task: " +
            (error.error || error.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error updating task: " + error.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        fetchTasks();
        alert("Task deleted successfully!");
      } else {
        const error = await response.json();
        alert(
          "Error deleting task: " +
            (error.error || error.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task: " + error.message);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setStatus("pending");
  };

  const refreshAuth = async () => {
    setLoading(true);
    await initAuth();
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!user || !authToken) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>Authentication Required</h3>
        <p>Please sign in to access the task manager.</p>
        <button
          onClick={refreshAuth}
          style={{ padding: "10px 20px", margin: "10px" }}
        >
          Try to Sign In Again
        </button>
        <p>
          <a href="/signin" style={{ color: "#0066cc" }}>
            Go to Sign In Page
          </a>{" "}
          |
          <a href="/signup" style={{ color: "#0066cc", marginLeft: "10px" }}>
            Sign Up
          </a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Task Manager</h1>
        <div>
          <span style={{ marginRight: "15px" }}>Welcome, {user.username}!</span>
          <button onClick={fetchTasks} style={{ padding: "5px 10px" }}>
            Refresh Tasks
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3>{editingTask ? "Edit Task" : "Create New Task"}</h3>

        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />

        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            height: "80px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            resize: "vertical",
          }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {!editingTask && (
          <>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              style={{
                marginBottom: "10px",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "100%",
              }}
            />
            {file && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                Selected file: {file.name}
              </p>
            )}
          </>
        )}

        <div>
          {editingTask ? (
            <>
              <button
                onClick={updateTask}
                style={{
                  marginRight: "10px",
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Update Task
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={createTask}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div>
        <h3>Your Tasks ({tasks.length})</h3>

        {tasks.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>
            No tasks yet. Create your first task above!
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.task_id || task.taskId}
              style={{
                padding: "15px",
                margin: "10px 0",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor:
                  task.status === "completed"
                    ? "#e8f5e8"
                    : task.status === "in-progress"
                    ? "#fff3cd"
                    : "#f9f9f9",
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
                  <h4 style={{ margin: "0 0 10px 0" }}>{task.title}</h4>
                  <p style={{ margin: "0 0 10px 0" }}>{task.description}</p>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    <span>
                      Status:{" "}
                      <strong
                        style={{
                          color:
                            task.status === "completed"
                              ? "green"
                              : task.status === "in-progress"
                              ? "orange"
                              : "blue",
                        }}
                      >
                        {task.status}
                      </strong>
                    </span>{" "}
                    |
                    <span>
                      {" "}
                      Created:{" "}
                      {new Date(
                        task.created_at || task.createdAt
                      ).toLocaleDateString()}
                    </span>
                    {(task.file_name || task.fileName) && (
                      <span>
                        {" "}
                        | File:{" "}
                        <strong>{task.file_name || task.fileName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginLeft: "15px" }}>
                  <button
                    onClick={() => startEdit(task)}
                    style={{
                      marginRight: "5px",
                      padding: "5px 10px",
                      fontSize: "12px",
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.task_id || task.taskId)}
                    style={{
                      padding: "5px 10px",
                      fontSize: "12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {(task.file_url || task.fileUrl) && (
                <div style={{ marginTop: "10px" }}>
                  <a
                    href={task.file_url || task.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0066cc" }}
                  >
                    📎 Download {task.file_name || task.fileName}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Debug Info */}
      <div
        style={{
          marginTop: "30px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
          fontSize: "12px",
          borderRadius: "4px",
        }}
      >
        <strong>Debug Info:</strong>
        <br />
        API URL: {API_URL}
        <br />
        Auth Token: {authToken ? "Present" : "Missing"}
        <br />
        User: {user?.username}
        <br />
        Tasks Count: {tasks.length}
      </div>
    </div>
  );
}

export default TaskManager;
