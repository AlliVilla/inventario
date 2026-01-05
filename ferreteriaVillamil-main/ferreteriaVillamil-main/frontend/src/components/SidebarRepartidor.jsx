import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaBox,
  FaTruck,
  FaUser,
  FaSignOutAlt,
  FaHistory,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/LogoFerreteriaVillamil.png";

// Configurar axios para enviar token en todas las peticiones
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function SidebarRepartidor({ isCollapsed: externalIsCollapsed, setIsCollapsed: externalSetIsCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(externalIsCollapsed || false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateUserData = () => {
      const usuarioData = sessionStorage.getItem("usuario");
      if (usuarioData) {
        setUserData(JSON.parse(usuarioData));
      }
    };

    updateUserData();

    // Escuchar cambios en sessionStorage
    const handleStorageChange = (e) => {
      if (e.key === 'usuario') {
        updateUserData();
      }
    };

    // Escuchar evento personalizado de actualización de perfil
    const handleProfileUpdate = (e) => {
      updateUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    // También verificar periódicamente por si los cambios son en la misma pestaña
    const interval = setInterval(updateUserData, 1000);

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
        externalSetIsCollapsed?.(true);
      } else {
        setIsCollapsed(false);
        externalSetIsCollapsed?.(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="fixed top-4 left-4 z-50 p-3 bg-[#163269] text-white rounded-lg shadow-lg md:hidden"
        >
          {isCollapsed ? <FaBars className="w-5 h-5" /> : <FaTimes className="w-5 h-5" />}
        </button>
      )}
      
      {/* Overlay for mobile */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-screen bg-white flex flex-col border-r shadow-lg transition-all duration-300 z-50 ${
        isCollapsed ? (isMobile ? '-translate-x-full' : 'w-20') : 'w-72'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-[#E6E6E6]">
          <div className="flex items-center justify-center gap-2">
            <img
              src={logo}
              alt="Ferretería Villamil Logo"
              className={`${isCollapsed ? 'w-12 h-12' : 'w-32 h-32'} object-contain transition-all duration-300`}
            />
          </div>
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-6 right-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isCollapsed ? <FaBars className="w-4 h-4 text-[#163269]" /> : <FaTimes className="w-4 h-4 text-[#163269]" />}
            </button>
          )}
        </div>

        {/*Menu */}
        <nav className="flex-1 py-8">
          <Link
            to="/repartidor"
            className={`flex items-center gap-3 px-6 py-4 mb-2 hover:bg-gray-50 transition-colors cursor-pointer ${
              isActive("/repartidor") ? "text-[#BC7D3B]" : "text-[#163269]"
            }`}
          >
            <FaHome className="w-6 h-6 flex-shrink-0" />
            {!isCollapsed && (
              <span
                className={`text-lg font-semibold ${
                  !isActive("/repartidor") && "underline"
                }`}
              >
                Dashboard
              </span>
            )}
          </Link>

          <Link
            to="/repartidor/pedidos"
            className={`flex items-center gap-3 px-6 py-4 mb-2 hover:bg-gray-50 transition-colors cursor-pointer ${
              isActive("/repartidor/pedidos")
                ? "text-[#BC7D3B]"
                : "text-[#163269]"
            }`}
          >
            <FaHistory className="w-6 h-6 flex-shrink-0" />
            {!isCollapsed && (
              <span
                className={`text-lg font-semibold ${
                  !isActive("/repartidor/pedidos") && "underline"
                }`}
              >
                Historial
              </span>
            )}
          </Link>

          <Link
            to="/repartidor/perfil-repartidor"
            className={`flex items-center gap-3 px-6 py-4 mb-2 hover:bg-gray-50 transition-colors cursor-pointer ${
              isActive("/repartidor/perfil-repartidor") ? "text-[#BC7D3B]" : "text-[#163269]"
            }`}
          >
            <FaUser className="w-6 h-6 flex-shrink-0" />
            {!isCollapsed && (
              <span
                className={`text-lg font-semibold ${
                  !isActive("/repartidor/perfil-repartidor") && "underline"
                }`}
              >
                Perfil
              </span>
            )}
          </Link>
        </nav>

        {/*User Profile*/}
        <div className="p-6 bg-[#E6E6E6] border-t border-[#B8B8B8] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 relative">
                {userData?.foto_perfil ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}/${userData.foto_perfil.startsWith('/') ? userData.foto_perfil.slice(1) : userData.foto_perfil}`}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/repartidor/perfil-repartidor')}
                  />
                ) : (
                  <div className="w-full h-full bg-[#B8B8B8] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#A0A0A0] transition-colors">
                    <FaUser 
                      onClick={() => navigate('/repartidor/perfil-repartidor')} 
                      className="w-8 h-8 text-black hover:text-[#BC7D3B]" 
                    />
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div>
                  <div className="font-semibold text-black">Bienvenido</div>
                  <div className="text-[#163269]">
                    {userData?.nombre || "Usuario"}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-100 rounded-full transition-colors group"
              title="Cerrar sesión"
            >
              <FaSignOutAlt className="w-5 h-5 text-red-600 group-hover:text-red-700" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
