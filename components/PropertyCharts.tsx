
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Property } from '../types';

interface PropertyChartsProps {
  properties: Property[];
}

const PropertyCharts: React.FC<PropertyChartsProps> = ({ properties }) => {
  if (properties.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center">
        <p className="text-gray-500">尚無資料，請先新增建案。</p>
      </div>
    );
  }

  const chartData = properties.map(p => ({
    name: p.name,
    '室內單價(萬)': parseFloat((p.price / p.indoor).toFixed(1)),
    '公設比(%)': parseFloat((((p.deed - p.indoor - p.balcony) / p.deed) * 100).toFixed(1)),
    '總價(萬)': p.price,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-800">室內單價比較 (萬/坪)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="室內單價(萬)" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-800">公設比分析 (%)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 50]} />
              <Tooltip />
              <Bar dataKey="公設比(%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-800">總價對比 (萬)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="總價(萬)" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PropertyCharts;
