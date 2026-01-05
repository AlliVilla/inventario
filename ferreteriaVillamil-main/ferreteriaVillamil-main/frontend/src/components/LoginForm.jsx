import React, { useState } from 'react';
import FerreteriaLogo from '../assets/LogoFerreteriaVillamil.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();
  
  // Estados para los campos del formulario
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/login`, {
        usuario: usuario.trim(),
        contrasena
      });
      
      console.log(response.data);
      
      // Guardar token y datos del usuario
      if (response.data.token && response.data.usuario) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        
        // Redirigir según el rol
        if (response.data.usuario.rol === 'Administrador') {
          navigate('/admin/dashboard');
        } else if (response.data.usuario.rol === 'Repartidor') {
          navigate('/repartidor');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-white flex">
      {/* Lado izquierdo - Formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <img 
              src={FerreteriaLogo} 
              alt="Ferretería Villamil" 
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
          </div>

          
          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {/* Campo Usuario */}
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Usuario:
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa tu usuario')}
                onInput={(e) => e.target.setCustomValidity('')}
              />
            </div>

            {/* Campo Contraseña */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Contraseña:
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onInvalid={(e) => e.target.setCustomValidity('Por favor ingresa tu contraseña')}
                onInput={(e) => e.target.setCustomValidity('')}
              />
              {/* TODO: Validar contraseña hasheada contra la BD */}
            </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Link de olvido de contraseña */}
          <div className="text-center mt-4">
            <button
              onClick={() => {
                // TODO: Navegar a página de recuperación de contraseña
                // navigate('/forgot-password');
                console.log('Recuperar contraseña');
              }}
              className="text-blue-900 hover:underline text-sm font-semibold"
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>
        </div>
      </div>

      {/* Lado derecho - Imagen de fondo */}
      <div className="hidden md:flex w-1/2 bg-cover bg-center relative" style={{
        backgroundImage: 'url(/ferreteria-background.jpg)'
      }}>
        {/* Overlay oscuro para mejorar contraste */}
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>
    </div>
  );
}

export default LoginForm;

