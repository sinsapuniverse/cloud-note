import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return <div style={{ padding: 24 }}>Cloud Note</div>;
}

createRoot(document.getElementById("root")).render(<App />);
