import React from 'react';
import { Clock, Coffee, Zap, Briefcase, Plus, Trash2 } from 'lucide-react';

interface DayActivity {
  time: string;
  activity: string;
  type: 'work' | 'meal' | 'reboot' | 'other';
}

interface PerfectDayProps {
  schedule: DayActivity[];
  onUpdate: (schedule: DayActivity[]) => void;
}

const TYPE_ICONS = {
  work: Briefcase,
  meal: Coffee,
  reboot: Zap,
  other: Clock
};

const TYPE_COLORS = {
  work: 'text-neon-magenta bg-neon-magenta/10 border-neon-magenta/20',
  meal: 'text-neon-lime bg-neon-lime/10 border-neon-lime/20',
  reboot: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
  other: 'text-white/40 bg-white/5 border-white/10'
};

export const PerfectDay: React.FC<PerfectDayProps> = ({ schedule, onUpdate }) => {
  const addActivity = () => {
    const newActivity: DayActivity = {
      time: '09:00',
      activity: 'New Activity',
      type: 'other'
    };
    onUpdate([...schedule, newActivity].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const removeActivity = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    onUpdate(newSchedule);
  };

  const updateActivity = (index: number, updates: Partial<DayActivity>) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    onUpdate(newSchedule.sort((a, b) => a.time.localeCompare(b.time)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Perfect Day Scheduler</h3>
        <button 
          onClick={addActivity}
          className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="relative space-y-4">
        {/* Timeline Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/5" />

        {schedule.map((item, i) => {
          const Icon = TYPE_ICONS[item.type];
          return (
            <div key={i} className="relative flex items-start gap-6 group">
              <div className={`z-10 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${TYPE_COLORS[item.type]}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group-hover:border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input 
                      type="time" 
                      value={item.time}
                      onChange={(e) => updateActivity(i, { time: e.target.value })}
                      className="bg-transparent text-xs font-bold text-white/40 outline-none focus:text-neon-cyan"
                    />
                    <input 
                      type="text" 
                      value={item.activity}
                      onChange={(e) => updateActivity(i, { activity: e.target.value })}
                      className="bg-transparent text-sm font-bold text-white outline-none focus:text-neon-cyan sm:col-span-2"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={item.type}
                      onChange={(e) => updateActivity(i, { type: e.target.value as any })}
                      className="bg-transparent text-[10px] uppercase font-bold text-white/20 outline-none focus:text-neon-cyan cursor-pointer"
                    >
                      <option value="work">Work</option>
                      <option value="meal">Meal</option>
                      <option value="reboot">Reboot</option>
                      <option value="other">Other</option>
                    </select>
                    <button 
                      onClick={() => removeActivity(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/10">
        <p className="text-[10px] text-neon-cyan/60 uppercase font-bold mb-2">Skylar's Insight</p>
        <p className="text-xs text-white/60 leading-relaxed italic">
          "Your schedule shows a high concentration of Deep Work in the morning. Consider moving your 'Reboot' session to 14:00 to combat your natural energy trough."
        </p>
      </div>
    </div>
  );
};
