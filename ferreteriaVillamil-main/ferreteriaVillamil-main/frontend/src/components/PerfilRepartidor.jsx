import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
        
function PerfilRepartidor() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setclave] = useState('');
  const [rol, setRol] = useState('Repartidor');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null); // Guardar la URL original
  const fileInputRef = useRef(null);

  useEffect(() => {
    handleGetUserInfo();
  }, []);

  const handleGetUserInfo = async () => {
    setLoading(true);
    
    try {
      const usuarioStorage = localStorage.getItem("usuario");
      if (!usuarioStorage) {
        throw new Error("No hay sesión activa");
      }
      const usuario = JSON.parse(usuarioStorage);
      const userId = usuario.id_usuario;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios/usuarios/${userId}`);
      
      const userData = response.data;
      setNombre(userData.nombre);
      setCorreo(userData.correo);    
      setTelefono(userData.telefono);
      setclave(''); // Por seguridad
      setRol(userData.rol);
      setUserData(userData);
      
      if (userData.foto_perfil) {
        // Remove leading / if present and construct proper URL
        const photoPath = userData.foto_perfil.startsWith('/') ? userData.foto_perfil.slice(1) : userData.foto_perfil;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        const fullUrl = `${baseUrl}/${photoPath}`;
        setPreviewImage(fullUrl);
        setOriginalPhotoUrl(fullUrl); // Guardar URL original
      } else {
        setPreviewImage(null);
        setOriginalPhotoUrl(null);
      }
    } catch (err) {
      message.error('Error al obtener información del usuario');
    } finally {
      setLoading(false);
    }
  };

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
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const usuarioStorage = localStorage.getItem("usuario");
      if (!usuarioStorage) {
        throw new Error("No hay sesión activa");
      }
      const usuario = JSON.parse(usuarioStorage);
      const userId = usuario.id_usuario;
      
      const updateData = {
        nombre,
        correo,
        telefono,
        rol
      };
      
      if (clave) {
        updateData.clave = clave;
      }

      const formData = new FormData();
      Object.keys(updateData).forEach(key => {
        formData.append(key, updateData[key]);
      });
      
      // Si hay un archivo nuevo, añadirlo
      if (previewImage && fileInputRef.current?.files[0]) {
        formData.append('foto_perfil', fileInputRef.current.files[0]);
      }
      // Si se eliminó la foto (previewImage es null pero había foto antes), enviar vacío para eliminar
      else if (!previewImage && userData?.foto_perfil) {
        formData.append('foto_perfil', ''); // Envía vacío para eliminar la foto
      }

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/usuarios/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      message.success('Usuario actualizado exitosamente');
      setIsEditing(false);
      setclave('');
      
      try {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios/usuarios/${userId}`);
        const updatedUserData = updatedResponse.data;
        localStorage.setItem("usuario", JSON.stringify(updatedUserData));
        
        // Forzar actualización del sidebar emitiendo un evento personalizado
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: updatedUserData 
        }));
      } catch (err) {
        console.log("Error al actualizar localStorage:", err);
      }
      
      handleGetUserInfo();
    } catch (err) {
      message.error('Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Guardar la URL original al empezar a editar
    if (userData?.foto_perfil) {
      const photoPath = userData.foto_perfil.startsWith('/') ? userData.foto_perfil.slice(1) : userData.foto_perfil;
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
      setOriginalPhotoUrl(`${baseUrl}/${photoPath}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setclave('');
    // Restaurar la imagen original al cancelar
    setPreviewImage(originalPhotoUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-5 pb-4 border-b-4" style={{ color: '#163269', borderColor: '#163269' }}>
            Mi Perfil
        </h1>

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
                    className={`w-44 h-44 border-2 ${isEditing ? 'border-dashed border-gray-300 cursor-pointer hover:border-[#163269]' : 'border-gray-200'} rounded-full flex items-center justify-center bg-gray-50 transition-colors`}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="text-center">
                        <UserOutlined className="text-4xl text-gray-400 mb-2" />
                        <div className="text-sm text-gray-500">
                          {isEditing ? "Click para cambiar foto" : "Sin foto"}
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
                  {isEditing && (
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
                  {!isEditing ? (
                    <button
                      onClick={handleEditClick}
                      disabled={loading}
                      className="w-full font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: '#163269',
                        color: 'white'
                      }}
                    >
                      Editar
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          backgroundColor: '#163269',
                          color: 'white'
                        }}
                      >
                        {loading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="w-full font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          backgroundColor: '#BC7D3B',
                          color: 'white'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
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
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      required
                      onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa el teléfono')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                      Contraseña:
                    </label>
                    <input
                      type="password"
                      value={clave}
                      onChange={(e) => setclave(e.target.value)}
                      placeholder={isEditing ? "Ingresa nueva contraseña (opcional)" : "••••••••"}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mt-5 sm:max-w-[48%]">
                  <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                    Rol:
                  </label>
                  <input
                    type="text"
                    value={rol}
                    disabled
                    className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerfilRepartidor;
