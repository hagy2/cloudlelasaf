// CuteHomepage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PinkNavbar from "./components/navbar";

const CuteHomepage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PinkNavbar />
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          background: "linear-gradient(to bottom, #ffe6f0, #fff5fb)",
          minHeight: "100vh",
          fontFamily: "'Comic Sans MS', cursive, sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            color: "#ff69b4",
            marginBottom: "20px",
          }}
        >
          💖 Welcome to Your Task Haven 💖
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#c71585",
            maxWidth: "600px",
            margin: "0 auto 30px auto",
          }}
        >
          Stay organized with a sprinkle of cuteness! Manage your tasks with ease,
          upload files, and track your progress in style. 💅
        </p>
        <button
          onClick={() => navigate("/tasks")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#ff85c1",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(255, 105, 180, 0.3)",
            transition: "0.3s",
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundColor = "#ffaad5")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundColor = "#ff85c1")
          }
        >
          🌸 Enter Task Manager
        </button>
      </div>
    </>
  );
};

export default CuteHomepage;
