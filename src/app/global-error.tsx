"use client";

// Last-resort boundary for errors thrown in the root layout itself. Must render
// its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
            The application ran into an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 14, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
