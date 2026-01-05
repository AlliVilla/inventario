import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

function InfoRepartidorCliente({ nombre, telefono }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex-shrink-0">
          <Avatar 
            size={48} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#B2B6B5' }}
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
            {nombre || 'No asignado'}
          </h4>
          <p className="text-sm sm:text-base text-gray-600 truncate">
            {telefono || 'No disponible'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default InfoRepartidorCliente;
