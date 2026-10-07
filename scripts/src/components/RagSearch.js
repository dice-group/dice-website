import React, { useState } from "react";

export default function RagSearch() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8787/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <form onSubmit={submit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about DICE projects, papers, people..."
          style={{
            width: "75%",
            padding: "12px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            marginLeft: 8,
          }}
        >
          {loading ? "Searching..." : "Ask"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>Answer</h3>

          <div style={{ whiteSpace: "pre-wrap" }}>
            {result.answer}
          </div>

          <h4 style={{ marginTop: 30 }}>
            Sources
          </h4>

          <ul>
            {result.sources.map((source) => (
              <li key={source.uri}>
                <a href={source.path || source.uri}>
                  {source.name}
                </a>

                {" "}
                ({source.kind})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}