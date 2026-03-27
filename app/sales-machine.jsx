"use client";

import { useState, useEffect, useRef } from "react";

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a legendary Direct-Response Copywriter — the fusion of David Ogilvy's research obsession, Gary Halbert's street-smart aggression, and Alex Hormozi's irresistible offer engineering. You write Gumroad sales pages that convert cold traffic into buyers.

Given a product name, niche, price, and value proposition, generate a complete high-conversion Gumroad sales page using layered PAS + AIDA frameworks.`;

export default function SalesMachine() {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    productName: "",
    niche: "",
    price: "",
    audience: "",
    transformation: ""
  });

  // --- API CALL LOGIC ---
  const handleGenerate = async () => {
    if (!formData.productName || !formData.niche) {
      alert("Please enter at least the Product Name and Niche.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${SYSTEM_PROMPT} \n\n PRODUCT DETAILS: ${JSON.stringify(formData)}`
        }),
      });

      const data = await response.json();
      setResult(data.text || "No response from AI.");
    } catch (error) {
      setResult("Error: Connection failed. Check your API Key in Vercel.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI DESIGN (YOUR ORIGINAL STYLE) ---
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: "#050505",
      color: "white",
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "540px",
        background: "#080808",
        border: "1px solid #1a1a1a",
        borderRadius: "32px",
        padding: "40px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: "100px",
            background: "rgba(255, 77, 109, 0.05)",
            border: "1px solid rgba(255, 77, 109, 0.2)",
            color: "#ff4d6d",
            fontSize: "10px",
            fontWeight: "800",
            letterSpacing: "0.15em",
            marginBottom: "20px"
          }}>PHASE 03 — SALES MACHINE</div>
          
          <h1 style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-0.04em", marginBottom: "10px" }}>
            High-Conversion <span style={{ color: "#ff4d6d" }}>Sales Machine</span>
          </h1>
          <p style={{ color: "#444", fontSize: "14px" }}>Generate professional sales copy in seconds.</p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "grid", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "10px", color: "#666", fontWeight: "700", letterSpacing: "0.05em" }}>PRODUCT NAME</label>
              <input 
                type="text" 
                placeholder="e.g. AI Blueprint"
                value={formData.productName}
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", padding: "14px", borderRadius: "14px", color: "white", outline: "none", fontSize: "14px" }} 
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "10px", color: "#666", fontWeight: "700", letterSpacing: "0.05em" }}>NICHE</label>
              <input 
                type="text" 
                placeholder="e.g. SaaS Founders"
                value={formData.niche}
                onChange={(e) => setFormData({...formData, niche: e.target.value})}
                style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", padding: "14px", borderRadius: "14px", color: "white", outline: "none", fontSize: "14px" }} 
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "10px", color: "#666", fontWeight: "700", letterSpacing: "0.05em" }}>PRICE & CORE OFFER</label>
            <textarea 
              placeholder="What is the price and the main result they get?"
              value={formData.transformation}
              onChange={(e) => setFormData({...formData, transformation: e.target.value})}
              style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", padding: "14px", borderRadius: "14px", color: "white", outline: "none", fontSize: "14px", minHeight: "100px", resize: "none" }} 
            />
          </div>

          {/* Action Button */}
          <button 
            onClick={handleGenerate}
            disabled={loading}
            style={{
              background: loading ? "#111" : "#ff4d6d",
              color: "white",
              border: "none",
              padding: "18px",
              borderRadius: "16px",
              fontWeight: "900",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, background 0.2s",
              marginTop: "10px",
              boxShadow: loading ? "none" : "0 10px 20px rgba(255, 77, 109, 0.2)"
            }}>
            {loading ? "WRITING YOUR PAGE..." : "GENERATE SALES PAGE"}
          </button>
        </div>

        {/* AI Result Area */}
        {result && (
          <div style={{
            marginTop: "40px",
            padding: "24px",
            background: "#000",
            border: "1px solid rgba(255, 77, 109, 0.3)",
            borderRadius: "20px",
            whiteSpace: "pre-wrap",
            fontSize: "15px",
            lineHeight: "1.7",
            color: "#eee",
            maxHeight: "500px",
            overflowY: "auto"
          }}>
            {result}
          </div>
        )}

        {/* Footer Navigation (The Dots) */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "40px" }}>
           {[1, 2, 3].map(i => (
             <div key={i} style={{
               width: "6px", height: "6px", borderRadius: "50%",
               background: i === 3 ? "#ff4d6d" : "#1a1a1a"
             }} />
           ))}
        </div>
      </div>
    </div>
  );
}
