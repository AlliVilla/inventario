import React, { useState, useEffect } from "react";
import { Avatar, message } from "antd";
import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  UserDeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserListAdmin() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [usuariosActivos, setUsuariosActivos] = useState(0);
  const [usuariosInactivos, setUsuariosInactivos] = useState(0);

  //cargar usuarios a la hora de entrar
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/usuarios/usuarios`
      );

      const usuariosData = response.data;
      setUsuarios(usuariosData);

      setTotalUsuarios(usuariosData.length);
      setUsuariosActivos(
        usuariosData.filter((u) => u.estado === "Activo").length
      );
      setUsuariosInactivos(
        usuariosData.filter((u) => u.estado === "Inactivo").length
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Error al cargar usuarios";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteUsuario = async (usuario) => {
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/usuarios/usuarios/${usuario.id_usuario}`
      );
      message.success("Usuario eliminado exitosamente");
      fetchUsuarios();
    } catch (err) {
      message.error("Error al eliminar usuario");
    }
  };

  const handleEditUsuario = (usuario) => {
    //hay que arreglar esto
    //  cuando este la opcion para editar
    navigate(`/admin/usuarios/editar/${usuario.id_usuario}`);
  };

  const handleToggleEstado = async (usuario) => {
    try {
      const nuevoEstado = usuario.estado === "Activo" ? "Inactivo" : "Activo";
      await axios.put(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/usuarios/usuarios/${usuario.id_usuario}`,
        {
          estado: nuevoEstado,
        }
      );

      message.success(
        `Usuario ${
          nuevoEstado === "Inactivo" ? "desactivado" : "activado"
        } exitosamente`
      );
      fetchUsuarios();
    } catch (err) {
      message.error("Error al cambiar el estado del usuario");
    }
  };

  const handleNuevoUsuario = () => {
    navigate("/admin/usuarios/crear-usuario");
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header (page) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
          <h1
            className="text-2xl sm:text-3xl font-bold pb-4 border-b-4"
            style={{ color: "#163269", borderColor: "#163269" }}
          >
            Lista de Usuarios
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Estadísticas usuarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <p className="text-base sm:text-lg font-semibold" style={{ color: "#163269" }}>
              Total Usuarios: <span className="ml-2">{totalUsuarios}</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <p className="text-base sm:text-lg font-semibold" style={{ color: "#163269" }}>
              Usuarios Activos: <span className="ml-2">{usuariosActivos}</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <p className="text-base sm:text-lg font-semibold" style={{ color: "#163269" }}>
              Usuarios Inactivos:{" "}
              <span className="ml-2">{usuariosInactivos}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end mb-4 gap-1">
          <button
            onClick={handleNuevoUsuario}
            className="px-8 py-3 rounded-lg text-white font-semibold text-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#163269" }}
          >
            Nuevo Usuario
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: "#163269" }}>
              Cargando usuarios...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id_usuario}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Header (card) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-[#E6E6E6] rounded-2xl shadow-lg gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      size={{ xs: 48, sm: 56, md: 64 }}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#808080" }}
                    />
                    <h3
                      className="text-lg sm:text-xl font-semibold"
                      style={{ color: "#163269" }}
                    >
                      {usuario.nombre}
                    </h3>
                  </div>
                  <span
                    className="px-4 sm:px-6 py-1 rounded-full text-white font-medium shadow-lg text-sm sm:text-base"
                    style={{
                      backgroundColor:
                        usuario.estado === "Activo" ? "#5DADE2" : "#BC7D3B",
                    }}
                  >
                    {usuario.estado}
                  </span>
                </div>

                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm sm:text-base" style={{ color: "#163269" }}>
                      {usuario.telefono}
                    </p>
                    <p className="text-sm sm:text-base" style={{ color: "#163269" }}>
                      {usuario.correo}
                    </p>
                    <p
                      className="text-sm sm:text-base font-medium"
                      style={{ color: "#163269" }}
                    >
                      {usuario.rol}
                    </p>
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => handleEditUsuario(usuario)}
                      className="p-3 rounded-lg transition-colors hover:bg-gray-100"
                      title="Editar usuario"
                    >
                      <EditOutlined
                        className="text-2xl"
                        style={{ color: "#163269" }}
                      />
                    </button>

                    {usuario.estado === "Activo" ? (
                      <button
                        onClick={() => handleToggleEstado(usuario)}
                        className="p-3 rounded-lg transition-colors hover:bg-red-100"
                        title="Desactivar usuario"
                      >
                        <UserDeleteOutlined
                          className="text-2xl"
                          style={{ color: "#163269" }}
                        />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleEstado(usuario)}
                        className="p-3 rounded-lg transition-colors hover:bg-green-100"
                        title="Activar usuario"
                      >
                        <UserAddOutlined
                          className="text-2xl"
                          style={{ color: "#163269" }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        
      </div>
    </div>
  );
}

export default UserListAdmin;
