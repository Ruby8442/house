
import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onDelete: (id: string) => void;
  onAnalyze: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete, onAnalyze }) => {
  const publicRatio = (((property.deed - property.indoor - property.balcony) / property.deed) * 100).toFixed(1);
  const indoorUnitPrice = (property.price / property.indoor).toFixed(1);
  const totalUnitPrice = (property.price / property.deed).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
      <div className="p-4 border-b border-gray-50 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{property.name}</h3>
          <p className="text-sm text-gray-500"><i className="fas fa-map-marker-alt mr-1"></i> {property.area} · {property.type}</p>
        </div>
        <div className="text-right">
          <span className="text-blue-600 font-bold text-xl">{property.price}</span>
          <span className="text-blue-600 text-sm ml-1">萬</span>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">室內單價</span>
          <span className="text-sm font-semibold">{indoorUnitPrice} 萬/坪</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">公設比</span>
          <span className="text-sm font-semibold text-orange-600">{publicRatio}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">總坪數(權狀)</span>
          <span className="text-sm font-semibold">{property.deed} 坪</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">室內實坪</span>
          <span className="text-sm font-semibold">{property.indoor} 坪</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">車位</span>
          <span className="text-sm font-semibold">{property.car}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">機車</span>
          <span className="text-sm font-semibold">{property.bike}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-3 flex gap-2">
        <button 
          onClick={() => onAnalyze(property)}
          className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg font-medium text-sm hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
        >
          <i className="fas fa-robot"></i> AI 分析
        </button>
        <button 
          onClick={() => onDelete(property.id)}
          className="bg-white border border-red-200 text-red-500 py-2 px-4 rounded-lg text-sm hover:bg-red-50 transition-colors"
        >
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;
