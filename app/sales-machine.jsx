"use client";

import { useState, useEffect, useRef } from "react";

// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `You are a legendary Direct-Response Copywriter — the fusion of David Ogilvy's research obsession, Gary Halbert's street-smart aggression, and Alex Hormozi's irresistible offer engineering. You write Gumroad sales pages that convert cold traffic into buyers.

Given a product name, niche, price, and value proposition, generate a complete high-conversion Gumroad sales page using layered PAS + AIDA frameworks.`;

export default function SalesMachine() {
  const [inputs, setInputs] = useState({
    productName: "",
    niche: "",
    price: "",
    audience: "",
    transformation: "",
  });
  const [isWriting, setIsWriting] = useState(false);
  const [output, setOutput] = useState("");

  const handleGenerate = async () => {
    if (!inputs.productName || !inputs.niche) {
      alert("Please fill in the required fields");
      return;
    }
    
    setIsWriting(true);
    setOutput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `SYSTEM_PROMPT: ${SYSTEM_PROMPT} \n\n USER_INPUTS: ${JSON.stringify(inputs)}`
        }),
      });

      const data = await response.json();
      if (data.text) {
        setOutput(data.text);
      }
    } catch (error) {
      console.error("Error:", error);
      setOutput("Error connecting to AI. Make sure your API Key is set in Vercel.");
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh", color: "white", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", border: "1px solid #1a1a1a", borderRadius: "24px", padding: "40px", background: "#080808" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "#ff4d6d", fontSize: "12px", letterSpacing: "2px", fontWeight: "bold" }}>PHASE 03 — SALES MACHINE</p>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginTop: "10px" }}>
            High-Conversion <span style={{ color: "#ff4d6d" }}>Sales Machine</span>
          </h1>
        </div>

        {/* Form Inputs */}
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ fontSize: "10px", color: "#555", marginBottom: "8px", display: "block" }}>PRODUCT NAME *</label>
              <input 
                style={{ width: "100%", background: "#111", border: "1px solid #222", padding: "12px", borderRadius: "8px", color: "white" }}
                onChange={(e) => setInputs({...inputs, productName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "#555", marginBottom: "8px", display: "block" }}>NICHE *</label>
              <input 
                style={{ width: "100%", background: "#111", border: "1px solid #222", padding: "12px", borderRadius: "8px", color: "white" }}
                onChange={(e) => setInputs({...inputs, niche: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "10px", color: "#555", marginBottom: "8px", display: "block" }}>CORE TRANSFORMATION *</label>
            <textarea 
              rows="3"
              style={{ width: "100%", background: "#111", border: "1px solid #222", padding: "12px", borderRadius: "8px", color: "white", resize: "none" }}
              onChange={(e) => setInputs({...inputs, transformation: e.target.value})}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isWriting}
            style={{ 
              width: "100%", padding: "16px", background: isWriting ? "#333" : "#ff4d6d", 
              borderRadius: "12px", color: "white", fontWeight: "bold", cursor: "pointer", border: "none", transition: "0.3s"
            }}
          >
            {isWriting ? "WRITING PAGE..." : "GENERATE SALES PAGE"}
          </button>
        </div>

        {/* Output Section */}
        {output && (
          <div style={{ marginTop: "40px", padding: "24px", background: "#000", border: "1px solid #ff4d6d33", borderRadius: "16px", whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#ddd" }}>
            {output}
          </div>
        )}

      </div>
    </div>
  );
}
