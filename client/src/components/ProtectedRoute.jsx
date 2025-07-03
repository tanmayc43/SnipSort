import { useLocation, Navigate } from 'react-router-dom';
import { UserAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = UserAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">You must log in first</h2>
        <Navigate to="/login" state={{ from: location }} replace />
      </div>
    );
  }

  return children;
} 