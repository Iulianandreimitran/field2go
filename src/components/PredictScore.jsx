"use client";

import { useEffect, useState } from "react";

export default function PredictScore({ userId, fieldId }) {
  const [prob, setProb] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const res = await fetch(`/api/predict?userId=${userId}&fieldId=${fieldId}`);
        const data = await res.json();
        if (!data.error) setProb(data.probability);
      } catch (err) {
        console.error("Eroare predicție:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId && fieldId) fetchPrediction();
  }, [userId, fieldId]);

  if (loading) return <p className="text-xs text-gray-400">Se încarcă predicția...</p>;
  if (prob === null) return <p className="text-xs text-red-400">Predicție indisponibilă</p>;

  const color = prob >= 70 ? "text-green-400" : prob >= 40 ? "text-yellow-400" : "text-red-400";

  return (
    <p className={`text-xs font-medium ${color}`}>
      🧠 Probabilitate rezervare: {prob}%
    </p>
  );
}
