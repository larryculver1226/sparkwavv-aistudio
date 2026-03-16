import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieData {
  category: string;
  current: number;
  target: number;
}

interface PieOfLifeProps {
  data: PieData[];
  onUpdate: (data: PieData[]) => void;
}

const COLORS = ['#00FFFF', '#00FF00', '#FF00FF', '#FFFF00', '#FF3F3F'];

export const PieOfLife: React.FC<PieOfLifeProps> = ({ data, onUpdate }) => {
  const handleValueChange = (index: number, field: 'current' | 'target', value: number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onUpdate(newData);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Pie of Life (Current vs Target)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[300px]">
        <div className="relative">
          <p className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-white/40 uppercase font-bold z-10">Current State</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="current"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="relative">
          <p className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-neon-cyan uppercase font-bold z-10">Target State</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="target"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((item, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs font-bold">{item.category}</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/40 uppercase font-bold">
                  <span>Current</span>
                  <span>{item.current}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={item.current}
                  onChange={(e) => handleValueChange(i, 'current', parseInt(e.target.value))}
                  className="w-full accent-white/20"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neon-cyan uppercase font-bold">
                  <span>Target</span>
                  <span>{item.target}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={item.target}
                  onChange={(e) => handleValueChange(i, 'target', parseInt(e.target.value))}
                  className="w-full accent-neon-cyan"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
