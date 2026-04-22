import React from 'react';

interface GateProps {
  id: string;
  name: string;
  section: string;
  density: number;
  status: 'CLEAR' | 'FILLING' | 'CONGESTED';
}

export const GateCard = ({ name, section, density, status }: GateProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'CLEAR': return 'bg-status-clear';
      case 'FILLING': return 'bg-status-filling';
      case 'CONGESTED': return 'bg-status-congested';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col space-y-4 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-textPrimary">{name}</h3>
          <p className="text-textSecondary font-medium">{section} Section</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-white font-bold text-xs tracking-wider ${getStatusColor()} shadow-md`}>
          {status}
        </div>
      </div>
      
      <div className="flex flex-col space-y-2 mt-2">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-textMuted">Density</span>
          <span className="text-textPrimary">{density}%</span>
        </div>
        <div className="w-full h-3 bg-white/40 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getStatusColor()} transition-all duration-1000 ease-in-out`} 
            style={{ width: `${density}%` }}
          />
        </div>
      </div>
    </div>
  );
};
