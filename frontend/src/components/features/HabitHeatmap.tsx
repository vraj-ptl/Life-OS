import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';

interface HabitHeatmapProps {
  completedDates: string[];
  createdAt: string;
  color?: string;
  year?: number;
}

export const HabitHeatmap = ({ 
  completedDates, 
  createdAt,
  color = '#10b981', // Default emerald green
  year = new Date().getFullYear() 
}: HabitHeatmapProps) => {
  
  // Calculate grid data
  const gridData = useMemo(() => {
    const dates = new Set(completedDates.map(d => d.split('T')[0]));
    const createdDateObj = new Date(createdAt);
    createdDateObj.setHours(0,0,0,0);
    
    // We'll generate a grid for the last 52 weeks
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 52 weeks * 7 days - 1
    
    // Adjust start date to be Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const weeks: { date: string; isCompleted: boolean; isFuture: boolean; isBeforeCreation: boolean }[][] = [];
    let currentDate = new Date(startDate);

    for (let w = 0; w < 52; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateString = currentDate.toISOString().split('T')[0];
        const isFuture = currentDate.getTime() > today.getTime();
        const isBeforeCreation = currentDate.getTime() < createdDateObj.getTime();
        
        week.push({
          date: dateString,
          isCompleted: dates.has(dateString),
          isFuture,
          isBeforeCreation
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  }, [completedDates, createdAt]);

  // Hex to RGB for opacity variations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '16, 185, 129';
  };

  const rgbColor = hexToRgb(color);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Very rough month labels calculation
  const monthLabels = [0, 4, 8, 13, 17, 21, 26, 30, 34, 39, 43, 47];

  return (
    <Card className="overflow-hidden">
      <h4 className="text-sm font-medium text-secondary mb-4">Activity Heatmap</h4>
      
      <div className="flex w-full overflow-x-auto pb-2 scrollbar-thin">
        {/* Day labels */}
        <div className="flex flex-col gap-[4px] text-[10px] text-muted mr-2 justify-between py-[12px] h-[115px]">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        <div className="flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex text-[10px] text-muted h-4 relative">
            {monthLabels.map((weekIdx, i) => (
              <span key={i} style={{ position: 'absolute', left: `${weekIdx * 16}px` }}>
                {months[(new Date().getMonth() + 1 + i) % 12]}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[4px]">
            {gridData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[4px]">
                {week.map((day, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    className="w-[12px] h-[12px] rounded-[2px] transition-colors hover:ring-1 flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: day.isFuture || day.isBeforeCreation
                        ? 'transparent' 
                        : day.isCompleted 
                          ? color 
                          : 'rgba(239,68,68,0.1)', // Slight red background for missed
                      opacity: day.isCompleted ? 1 : undefined,
                      boxShadow: day.isCompleted ? `0 0 5px rgba(${rgbColor}, 0.5)` : 'none',
                      color: day.isBeforeCreation ? '#64748b' : day.isCompleted ? '#fff' : '#ef4444',
                      fontSize: '8px'
                    }}
                    title={`${day.date}${day.isCompleted ? ' (Completed)' : day.isBeforeCreation ? ' (Before Creation)' : day.isFuture ? '' : ' (Missed)'}`}
                  >
                    {!day.isFuture && day.isBeforeCreation && '-'}
                    {!day.isFuture && !day.isBeforeCreation && !day.isCompleted && 'x'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 text-[10px] text-muted mt-2">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-white/5" />
          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: `rgba(${rgbColor}, 0.4)` }} />
          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: `rgba(${rgbColor}, 0.7)` }} />
          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: color }} />
        </div>
        <span>More</span>
      </div>
    </Card>
  );
};
