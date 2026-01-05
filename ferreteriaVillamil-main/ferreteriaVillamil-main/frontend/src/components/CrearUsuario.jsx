import React, { useState, useRef } from 'react';
import { Input, Select, Avatar, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

function CrearUsuario() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setclave] = useState('');
  const [rol, setRol] = useState('Repartidor');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

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
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('correo', correo);
      formData.append('clave', clave);
      formData.append('telefono', telefono);
      formData.append('rol', rol);
      
      if (previewImage && fileInputRef.current?.files[0]) {
        formData.append('foto_perfil', fileInputRef.current.files[0]);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/usuarios/usuarios`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log(response.data);
      message.success('Usuario registrado exitosamente');
      
      setNombre('');
      setCorreo('');    
      setTelefono('');
      setclave('');
      setRol('Repartidor');
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      navigate('/admin/usuarios');

      
    } catch (err) {
      message.error('Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-5 pb-4 border-b-4" style={{ color: '#163269', borderColor: '#163269' }}>
          Registrar Usuario
        </h1>

        <div className="flex gap-10 mt-10">
          {/* PP */}
          <div className="flex flex-col gap-5">
            <div 
              onClick={handleImageClick}
              className="w-44 h-44 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-[#163269] transition-colors relative"
            >
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="text-center">
                  <UserOutlined className="text-4xl text-gray-400 mb-2" />
                  <div className="text-sm text-gray-500">Click para subir foto</div>
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
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Eliminar Foto
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#163269',
                color: 'white'
              }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {/* Forms */}
          <div className="flex-1 max-w-3xl">
            <div className="grid grid-cols-2 gap-5">
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
                  Telefono:
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
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={clave}
                  onChange={(e) => setclave(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa la contraseña')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
              </div>
            </div>

            <div className="mt-5" style={{ maxWidth: '48%' }}>
              <label className="block font-semibold mb-2" style={{ color: '#163269' }}>
                Rol:
              </label>
              <Select 
                value={rol}
                onChange={(value) => setRol(value)}
                className="w-full"
                size="large"
              >
                <Option value="Repartidor">Repartidor</Option>
                <Option value="Administrador">Administrador</Option>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrearUsuario;