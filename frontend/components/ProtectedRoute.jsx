import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ role, children }) {
  const raw = localStorage.getItem('user');
  if (!raw) return <Navigate to="/login" replace />;
  const user = JSON.parse(raw);
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
