import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Check, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface HabitLog {
  date: string;
  progress: number;
  isCompleted: boolean;
}

interface Habit {
  _id: string;
  name: string;
  icon: string;
  color: string;
  trackingType: string;
  targetValue: number;
  unit: string;
  frequency: string;
  timeOfDay: string;
  currentStreak: number;
  logs: HabitLog[];
}

interface WeeklyTrackerProps {
  habits: Habit[];
}

type ViewMode = 'weekly' | 'monthly';

// Get all weeks (Mon-Sun) that overlap with a given month
const getWeeksOfMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks: { start: Date; end: Date; label: string }[] = [];

  // Find the Monday on or before the first day of the month
  let current = new Date(firstDay);
  const dayOfWeek = current.getDay();
  current.setDate(current.getDate() - ((dayOfWeek + 6) % 7));

  while (current <= lastDay) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: `${startLabel} – ${endLabel}`,
    });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

const getDaysForWeek = (mondayDate: Date) => {
  const days: { date: string; label: string; fullDate: string; isToday: boolean }[] = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      label: dayNames[i],
      fullDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      isToday: dateStr === todayStr,
    });
  }

  return days;
};

export const WeeklyTracker = ({ habits }: WeeklyTrackerProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate month options
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Generate year options (from 2020 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);

  // Week data for weekly view
  const weekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (weekOffset * 7));
    return getDaysForWeek(monday);
  }, [weekOffset]);

  // Month data for monthly view
  const monthWeeks = useMemo(() => {
    return getWeeksOfMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  if (habits.length === 0) return null;

  const renderWeekTable = (days: ReturnType<typeof getDaysForWeek>, weekLabel?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];

    return (
      <div key={weekLabel} style={{ marginBottom: weekLabel ? '16px' : 0 }}>
        {weekLabel && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(14, 165, 233, 0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-primary-light)',
            letterSpacing: '0.3px',
          }}>
            📅 {weekLabel}
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    minWidth: '200px',
                  }}
                >
                  Habit
                </th>
                {days.map(day => (
                  <th
                    key={day.date}
                    style={{
                      textAlign: 'center',
                      padding: '12px 8px',
                      color: day.isToday ? 'var(--color-primary-light)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      background: day.isToday ? 'rgba(14, 165, 233, 0.06)' : 'transparent',
                      position: 'relative',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{day.label}</div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        color: day.isToday ? 'var(--color-primary-light)' : 'var(--text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      {day.fullDate}
                    </div>
                    {day.isToday && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '20%',
                          right: '20%',
                          height: '2px',
                          borderRadius: '2px',
                          background: 'var(--color-primary)',
                        }}
                      />
                    )}
                  </th>
                ))}
                <th
                  style={{
                    textAlign: 'center',
                    padding: '12px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => {
                // Count completed days this week
                const weekCompletions = days.filter(day => {
                  const log = habit.logs?.find((l: HabitLog) => l.date.startsWith(day.date));
                  return log?.isCompleted;
                }).length;

                // Determine days in past (including today)
                const pastDays = days.filter(d => d.date <= todayStr).length;
                const scorePercent = pastDays > 0 ? Math.round((weekCompletions / pastDays) * 100) : 0;

                return (
                  <tr key={habit._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            background: `${habit.color}20`,
                            flexShrink: 0,
                          }}
                        >
                          {habit.icon}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {habit.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {habit.frequency} · {habit.timeOfDay}
                          </div>
                        </div>
                      </div>
                    </td>

                    {days.map(day => {
                      const log = habit.logs?.find((l: HabitLog) => l.date.startsWith(day.date));
                      const isFuture = day.date > todayStr;
                      const isCompleted = log?.isCompleted;
                      const hasPartialProgress = log && !log.isCompleted && log.progress > 0;

                      return (
                        <td
                          key={day.date}
                          style={{
                            textAlign: 'center',
                            padding: '14px 8px',
                            background: day.isToday ? 'rgba(14, 165, 233, 0.04)' : 'transparent',
                          }}
                        >
                          {isFuture ? (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px dashed rgba(255,255,255,0.1)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            />
                          ) : isCompleted ? (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: `linear-gradient(135deg, ${habit.color}, ${habit.color}90)`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 0 12px ${habit.color}40`,
                              }}
                            >
                              <Check size={14} color="#fff" strokeWidth={3} />
                            </div>
                          ) : hasPartialProgress ? (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: `${habit.color}30`,
                                border: `1px solid ${habit.color}50`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: habit.color,
                              }}
                            >
                              {Math.round((log.progress / habit.targetValue) * 100)}%
                            </div>
                          ) : (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <X size={12} color="rgba(239,68,68,0.5)" strokeWidth={2.5} />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '44px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color:
                            scorePercent >= 80
                              ? '#10b981'
                              : scorePercent >= 50
                                ? '#f59e0b'
                                : scorePercent > 0
                                  ? '#ef4444'
                                  : 'var(--text-muted)',
                          background:
                            scorePercent >= 80
                              ? 'rgba(16,185,129,0.12)'
                              : scorePercent >= 50
                                ? 'rgba(245,158,11,0.12)'
                                : scorePercent > 0
                                  ? 'rgba(239,68,68,0.12)'
                                  : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        {scorePercent}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Compute monthly overall score
  const monthlyOverallScore = useMemo(() => {
    if (viewMode !== 'monthly' || habits.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let totalCompleted = 0;
    let totalPossible = 0;

    for (const week of monthWeeks) {
      const days = getDaysForWeek(week.start);
      for (const habit of habits) {
        for (const day of days) {
          if (day.date > todayStr) continue;
          totalPossible++;
          const log = habit.logs?.find((l: HabitLog) => l.date.startsWith(day.date));
          if (log?.isCompleted) totalCompleted++;
        }
      }
    }

    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  }, [viewMode, monthWeeks, habits]);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
    color: active ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  });

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(30, 41, 59, 0.8)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            {viewMode === 'weekly' ? 'Weekly Tracker' : 'Monthly Overview'}
          </h3>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px' }}>
            <button onClick={() => setViewMode('weekly')} style={btnStyle(viewMode === 'weekly')}>
              Week
            </button>
            <button onClick={() => setViewMode('monthly')} style={btnStyle(viewMode === 'monthly')}>
              Month
            </button>
          </div>
        </div>

        {viewMode === 'weekly' ? (
          /* Weekly navigation arrows */
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '100px', textAlign: 'center' }}>
              {weekOffset === 0 ? 'Current Week' : `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Ago`}
            </span>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              disabled={weekOffset >= 0}
              style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', border: 'none', cursor: weekOffset >= 0 ? 'not-allowed' : 'pointer', color: weekOffset >= 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          /* Monthly picker: month and year dropdowns */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary-light)' }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={selectStyle}
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={selectStyle}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'weekly' ? (
        /* Single week table */
        <div style={{ overflowX: 'auto' }}>
          {renderWeekTable(weekData)}
        </div>
      ) : (
        /* Monthly view: all weeks of the selected month */
        <div>
          {/* Monthly summary bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(14, 165, 233, 0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {monthNames[selectedMonth]} {selectedYear} — {monthWeeks.length} weeks
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Overall Score
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: monthlyOverallScore >= 80 ? '#10b981' : monthlyOverallScore >= 50 ? '#f59e0b' : monthlyOverallScore > 0 ? '#ef4444' : 'var(--text-muted)',
                background: monthlyOverallScore >= 80 ? 'rgba(16,185,129,0.15)' : monthlyOverallScore >= 50 ? 'rgba(245,158,11,0.15)' : monthlyOverallScore > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              }}>
                {monthlyOverallScore}%
              </span>
            </div>
          </div>

          {/* Render each week of the month */}
          {monthWeeks.map(week => {
            const days = getDaysForWeek(week.start);
            return renderWeekTable(days, week.label);
          })}
        </div>
      )}
    </Card>
  );
};
