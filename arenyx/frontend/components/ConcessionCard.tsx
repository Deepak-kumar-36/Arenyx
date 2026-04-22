import React from 'react';
import { Clock, Ticket } from 'lucide-react';

interface ConcessionProps {
  id: string;
  name: string;
  waitTime: number;
  status: 'CLEAR' | 'FILLING' | 'CONGESTED';
  offer?: string | null;
}

export const ConcessionCard = ({ name, waitTime, status, offer }: ConcessionProps) => {
  const getStatusColor = () => {
    if (status === 'CLEAR') return 'bg-status-clear';
    if (status === 'FILLING') return 'bg-status-filling';
    return 'bg-status-congested';
  };

  return (
    <div className={`glass-card p-6 flex flex-col space-y-4 hover:scale-[1.02] transition-transform duration-300 ${offer ? 'border-2 border-status-clear/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-status-clear/10' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-textPrimary">{name}</h3>
          <p className="text-textSecondary font-medium flex items-center mt-1"><Clock className="h-4 w-4 mr-1"/> {waitTime} mins</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-white font-bold text-xs tracking-wider ${getStatusColor()} shadow-md`}>
          {status}
        </div>
      </div>
      
      {offer && (
         <div className="mt-2 p-3 bg-white/40 border border-status-clear text-status-clear font-extrabold flex items-center justify-center rounded-xl shadow-sm tracking-wide">
            <Ticket className="h-5 w-5 mr-2" />
            <span>{offer}</span>
         </div>
      )}
    </div>
  );
};
