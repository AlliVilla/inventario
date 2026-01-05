import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import axios from 'axios';

const CancelarEnvioModal = ({ isOpen, onClose, pedidoId }) => {

  if (!isOpen) return null;

  const handleCancelarEnvio = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedidos/${pedidoId}/cancelar-envio`);
      message.success('Envio cancelado correctamente');
      onClose();
    } catch (error) {
      message.error('Error al cancelar envio: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10 relative flex flex-col items-center animate-fadeIn">
        <h2 className="text-3xl font-bold text-black mb-10 tracking-wide">
          AVISO
        </h2>
        <div className="w-full mb-12">
          <label className="block text-[#1e3a8a] text-lg font-medium mb-2 pl-1">
            Estas seguro de cancelar el envio?
          </label>
          
        </div>

        <div className="flex gap-6 w-full justify-center">
          <button
            onClick={onClose}
            className="px-10 py-2.5 border-2 rounded-lg border-gray text-black font text-lg hover:bg-gray-50 transition-colors bg-white min-w-[140px]"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCancelarEnvio}
            className="px-10 py-2.5 rounded-lg bg-[#1e3a8a] text-white font text-lg hover:bg-blue-900 transition-colors min-w-[140px]"
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
};

export default CancelarEnvioModal;
