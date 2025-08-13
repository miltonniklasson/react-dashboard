import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>404 - Not Found</h2>
      <Link to="/dashboard">Go Home</Link>
    </div>
  );
}
