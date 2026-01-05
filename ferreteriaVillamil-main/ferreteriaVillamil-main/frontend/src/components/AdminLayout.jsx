import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { SidebarAdmin } from "./SidebarAdmin";
import { FaBars, FaTimes } from "react-icons/fa";

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="fixed top-4 left-4 z-50 p-3 bg-[#163269] text-white rounded-lg shadow-lg md:hidden"
        >
          {isSidebarCollapsed ? <FaBars className="w-5 h-5" /> : <FaTimes className="w-5 h-5" />}
        </button>
      )}
      
      {/* Overlay for mobile */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      
      <SidebarAdmin isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
        isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-20' : 'ml-72'
      }`}>
        {/* Main Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
