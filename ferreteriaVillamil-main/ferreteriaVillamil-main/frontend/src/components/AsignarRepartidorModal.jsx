import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import axios from 'axios';

const AsignarRepartidorModal = ({ isOpen, onClose, onAssign, repartidores = [], pedidoId }) => {
  const [selectedRepartidor, setSelectedRepartidor] = useState('');

  if (!isOpen) return null;

  const handleAssignRepartidor = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedidos/${pedidoId}/asignar-repartidor`, { id_repartidor: selectedRepartidor });
      onAssign(selectedRepartidor);
      setSelectedRepartidor('');
      message.success('Repartidor asignado correctamente');
      onClose();
    } catch (error) {
      message.error('Error al asignar repartidor: ' + (error.response?.data?.message || error.message));
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
            Indicar repartidor:
          </label>
          
          <div className="relative w-full">
            <select
              value={selectedRepartidor}
              onChange={(e) => setSelectedRepartidor(e.target.value)}
              className="w-full appearance-none border-2 border-[#1e3a8a] rounded-lg py-3 pl-6 pr-14 text-lg text-black focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 bg-white cursor-pointer"
            >
              <option value="" disabled>Selecciona un repartidor</option>
              {repartidores.map((rep) => (
                <option key={rep.id_usuario} value={rep.id_usuario}>
                  {rep.nombre}
                </option>
              ))}
            </select>
            
          </div>
        </div>

        <div className="flex gap-6 w-full justify-center">
          <button
            onClick={onClose}
            className="px-10 py-2.5 border-2 rounded-lg border-gray text-black font text-lg hover:bg-gray-50 transition-colors bg-white min-w-[140px]"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleAssignRepartidor}
            disabled={!selectedRepartidor}
            className="px-10 py-2.5 rounded-lg bg-[#1e3a8a] text-white font text-lg hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            Asignar
          </button>
        </div>

      </div>
    </div>
  );
};

export default AsignarRepartidorModal;
