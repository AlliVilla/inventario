import React, { useState, useEffect, useRef } from "react";
import { Input, Select, Avatar, message, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const { Option } = Select;

function EditarUsuario() {
  const navigate = useNavigate();
  const { id } = useParams(); //parametro de la url
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [clave, setclave] = useState("");
  const [rol, setRol] = useState("Repartidor");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3000/api"
          }/usuarios/usuarios/${id}`
        );
        
        const userData = response.data;
        setNombre(userData.nombre);
        setCorreo(userData.correo);
        setTelefono(userData.telefono);
        setRol(userData.rol);
        setUserData(userData); // Guardar datos completos del usuario
        if (userData.foto_perfil) {
          // Remove leading / if present and construct proper URL
          const photoPath = userData.foto_perfil.startsWith('/') ? userData.foto_perfil.slice(1) : userData.foto_perfil;
          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const fullUrl = `${baseUrl}/${photoPath}`;
          setPreviewImage(fullUrl);
        }
      } catch (err) {
        message.error("Error al cargar usuario");
        navigate("/admin/usuarios");
      } finally {
        setFetchingUser(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, navigate]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        message.error('Por favor selecciona un archivo de imagen válido');
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const updateData = {
        nombre,
        correo,
        telefono,
        rol,
      };

      if (clave.trim() !== "") {
        updateData.clave = clave;
      }

      const formData = new FormData();
      Object.keys(updateData).forEach(key => {
        formData.append(key, updateData[key]);
      });
      
      // Si hay un archivo nuevo, añadirlo
      if (fileInputRef.current?.files[0]) {
        formData.append('foto_perfil', fileInputRef.current.files[0]);
      }
      // Si se eliminó la foto (previewImage es null pero había foto antes), enviar vacío para eliminar
      else if (!previewImage && userData?.foto_perfil) {
        formData.append('foto_perfil', ''); // Envía vacío para eliminar la foto
      }

      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api"
        }/usuarios/usuarios/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      message.success("Usuario actualizado exitosamente");

      // Actualizar localStorage con los datos actualizados del usuario
      try {
        const updatedResponse = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3000/api"
          }/usuarios/usuarios/${id}`
        );
        const updatedUserData = updatedResponse.data;
        localStorage.setItem("usuario", JSON.stringify(updatedUserData));
        
        // Forzar actualización del sidebar emitiendo un evento personalizado
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: updatedUserData 
        }));
      } catch (err) {
        console.log("Error al actualizar localStorage:", err);
      }

      navigate("/admin/usuarios");
    } catch (err) {
      message.error("Error al actualizar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1
          className="text-2xl md:text-3xl font-bold mb-5 pb-4 border-b-4"
          style={{ color: "#163269", borderColor: "#163269" }}
        >
          Perfil de {userData?.nombre || "Usuario"}
        </h1>

        {fetchingUser ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            {/* Photo Section */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-[#163269] px-4 py-2">
                  <h3 className="text-white font-semibold">Foto de Perfil</h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center gap-5">
                    <div 
                      onClick={handleImageClick}
                      className="w-44 h-44 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-[#163269] transition-colors relative"
                    >
                      {previewImage ? (
                        <>
                          <img 
                            src={previewImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full"
                          />
                        </>
                      ) : (
                        <div className="text-center">
                          <UserOutlined className="text-4xl text-gray-400 mb-2" />
                          <div className="text-sm text-gray-500">
                            Click para cambiar foto
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {previewImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Eliminar Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Forms Section */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-[#163269] px-4 py-2">
                  <h3 className="text-white font-semibold">Información Personal</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                        Nombre:
                      </label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ingresa el nombre"
                        className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                        style={{ focusBorderColor: '#163269' }}
                        required
                        onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa el nombre')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                        Correo:
                      </label>
                      <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="Ingresa el correo"
                        className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                        required
                        onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa el correo')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                        Teléfono:
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ingresa el teléfono"
                        className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                        required
                        onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa el teléfono')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                        Rol:
                      </label>
                      <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                        style={{ focusBorderColor: '#163269' }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Repartidor">Repartidor</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                      Contraseña:
                    </label>
                    <input
                      type="password"
                      value={clave}
                      onChange={(e) => setclave(e.target.value)}
                      placeholder="Dejar en blanco para no cambiar"
                      className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                      style={{ focusBorderColor: '#163269' }}
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: '#163269',
                        color: 'white'
                      }}
                    >
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => navigate("/admin/usuarios")}
                      disabled={loading}
                      className="flex-1 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: '#BC7D3B',
                        color: 'white'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditarUsuario;
