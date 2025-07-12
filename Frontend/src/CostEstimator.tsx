import React, { useState } from "react";
import { URI } from "./secret";

interface Sku {
  name: string;
  description: string;
  usageUnit: string;
  price: number;
}

interface Service {
  name: string;
  displayName: string;
  skus: Sku[];
}

interface CostEstimate {
  totalCost: number;
  services: Service[];
}

export function CostEstimator({ folderId, editedCode }: { folderId: any, editedCode: string }) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkus, setShowSkus] = useState<{ [key: string]: boolean }>({});
  const [costFeedback, setCostFeedback] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fetchCostFeedback = async () => {
  setLoadingFeedback(true);
  setFeedbackError(null);
  setCostFeedback(null);

  try {
    const res = await fetch(`${URI}/api/costFeedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prompt: editedCode }),
    });
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    setCostFeedback(data.answer);
  } catch (err) {
    console.error(err);
    setFeedbackError("Error fetching cost feedback. Please try again.");
  } finally {
    setLoadingFeedback(false);
  }
};


  
  const calculateCost = async () => {
    setLoading(true);
    setError(null);
    setEstimate(null);

    try {
      const res = await fetch(`${URI}/api/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folderId: folderId }),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data: CostEstimate = await res.json();
      setEstimate(data);
    } catch (err) {
      console.error(err);
      setError("Error calculating cost. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSkus = (serviceName: string) => {
    setShowSkus((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  return (
    <div
      style={{
        padding: 15,
        maxWidth: 600,
        margin: "20px auto",
        backgroundColor: "#bg-dark", 
        color: "#f8fafc",
        fontFamily: "Inter, sans-serif",
        borderRadius: 10,
        boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <button
          onClick={calculateCost}
          disabled={loading}
          style={{
            backgroundColor: "#065f46",
            color: "#fff",
            padding: "0.6rem 1.2rem",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
          }}
        >
          {loading ? "Calculating..." : "Costs (€)"}
        </button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
  <button
    onClick={fetchCostFeedback}
    disabled={loadingFeedback}
    style={{
      backgroundColor: "#1e3a8a", 
      color: "#fff",
      padding: "0.5rem 1rem",
      border: "none",
      borderRadius: 6,
      cursor: loadingFeedback ? "not-allowed" : "pointer",
      fontSize: 14,
    }}
  >
    {loadingFeedback ? "Loading description..." : "💬 Cost Output"}
  </button>
</div>
{costFeedback && (
  <div
    style={{
      marginTop: 10,
      padding: 10,
      backgroundColor: "#1e40af",
      color: "#f8fafc",
      borderRadius: 6,
      fontSize: 14,
      whiteSpace: "pre-wrap",
    }}
  >
    {costFeedback}
  </div>
)}

{feedbackError && (
  <p style={{ color: "#dc2626", textAlign: "center" }}>
    {feedbackError}
  </p>
)}


      {error && (
        <p style={{ color: "#dc2626", textAlign: "center" }}>{error}</p>
      )}

      {estimate && (
        <>
          <div
            style={{
              background: "#064e3b", 
              border: "1px solid #047857",
              padding: 12,
              borderRadius: 6,
              marginBottom: 12,
              textAlign: "center",
              fontSize: 17,
            }}
          >
            <strong>Total estimated cost:</strong> €
            {estimate.totalCost.toFixed(2)}
          </div>

          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              padding: 4,
              border: "1px solid #047857",
              borderRadius: 6,
              backgroundColor: "#065f46",
            }}
          >
            {estimate.services.length > 0 ? (
              estimate.services.map((svc) => (
                <div
                  key={svc.name}
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    backgroundColor: "#047857",
                    borderRadius: 6,
                  }}
                >
                  <h2
                    style={{
                      color: "#f8fafc", 
                      marginBottom: 6,
                      fontSize: 18,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {svc.displayName}
                    <button
                      onClick={() => toggleSkus(svc.name)}
                      style={{
                        backgroundColor: "transparent",
                        color: "#f8fafc",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      {showSkus[svc.name] ? "Hide SKUs ▲" : "Show SKUs ▼"}
                    </button>
                  </h2>

                  <div
                    style={{
                      maxHeight: showSkus[svc.name] ? 500 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-out",
                    }}
                  >
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {svc.skus.map((sku) => (
                        <li
                          key={sku.name}
                          style={{
                            borderBottom: "1px solid #065f46",
                            padding: "4px 0",
                          }}
                        >
                          <div>
                            <strong>{sku.description}</strong>
                          </div>
                          <div style={{ color: "#d1fae5", fontSize: 13 }}>
                            Unit: {sku.usageUnit} | Price: €
                            {sku.price.toFixed(4)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center" }}>No active services found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
