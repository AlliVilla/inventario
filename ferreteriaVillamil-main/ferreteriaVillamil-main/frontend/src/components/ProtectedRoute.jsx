import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const usuario = sessionStorage.getItem('usuario');
    
    if (token && usuario) {
      const userData = JSON.parse(usuario);
      
      // Verificar si se requiere un rol específico
      if (requiredRole && userData.rol !== requiredRole) {
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [requiredRole]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Cargando...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico y no coincide, redirigir al login
  if (requiredRole) {
    const usuario = sessionStorage.getItem('usuario');
    const userData = JSON.parse(usuario);
    if (userData.rol !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
