'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';
import { gsap } from 'gsap';
import styles from './Calendar.module.css';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>(`/calendar?year=${year}&month=${month}`);
      if (res.success && res.data) {
        setCalendarData(res.data.calendarMap);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
    setSelectedDay(null); // Reset selected day on month change
  }, [year, month]);

  // GSAP 3D Hover effect for cells
  useEffect(() => {
    if (!isLoading && gridRef.current) {
      const cells = gridRef.current.querySelectorAll(`.${styles.dayCell}`);
      
      cells.forEach((cell: any) => {
        // Remove empty cells from animation
        if (cell.classList.contains(styles.dayCellEmpty)) return;

        cell.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = cell.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateX = ((y - centerY) / centerY) * -10;
          const rotateY = ((x - centerX) / centerX) * 10;
          
          gsap.to(cell, {
            rotateX,
            rotateY,
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        cell.addEventListener('mouseleave', () => {
          gsap.to(cell, {
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.5,
            ease: "power2.out"
          });
        });
      });
    }
  }, [isLoading, calendarData]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month, 1));



  // Generate grid cells
  const getDaysArray = () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null); // Empty slots before the 1st
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getDayData = (day: number) => {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData ? calendarData[dateString] : null;
  };

  const determineGlow = (data: any) => {
    if (!data) return '';
    let score = 0;
    if (data.tasks) score += data.tasks.filter((t: any) => t.status === 'done').length * 2;
    if (data.habits) score += data.habits.length * 3;
    
    if (score >= 10) return styles.glowHigh;
    if (score >= 5) return styles.glowMedium;
    if (score > 0) return styles.glowLow;
    return '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>God View Calendar</h1>
          <p>Your entire Life OS across time.</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.monthNav}>
            <button onClick={handlePrevMonth} className={styles.navBtn}>
              <ChevronLeft size={20} />
            </button>
            <span className={styles.currentMonth}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className={styles.navBtn}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.calendarWrapper}>
          <div className={styles.weekdays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-primary)' }}>
              Loading...
            </div>
          ) : (
            <div className={styles.daysGrid} ref={gridRef}>
              {getDaysArray().map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />;
                
                const data = getDayData(day);
                const glowClass = determineGlow(data);
                
                const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();
                const isSelected = selectedDay === day;

                return (
                  <div 
                    key={day} 
                    className={`${styles.dayCell} ${glowClass} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className={styles.dayNumber}>{day}</span>
                    {data && (
                      <div className={styles.indicators}>
                        {data.tasks?.map((t: any, i: number) => (
                          <div key={`t-${i}`} className={`${styles.indicatorItem} ${styles.indicatorTask}`}>
                            {t.title}
                          </div>
                        ))}
                        {data.habits?.map((h: any, i: number) => (
                          <div key={`h-${i}`} className={`${styles.indicatorItem} ${styles.indicatorHabit}`}>
                            {h.name}
                          </div>
                        ))}
                        {data.subscriptions?.map((s: any, i: number) => (
                          <div key={`s-${i}`} className={`${styles.indicatorItem} ${styles.indicatorSub}`}>
                            ${s.amount} - {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.sidePanel}>
          {selectedDay ? (
            <div className={styles.focusPanel}>
              <div className={styles.focusHeader}>
                <h2>Daily Focus</h2>
                <div className={styles.selectedDateBadge}>
                  <CalendarIcon size={16} />
                  <span>{new Date(year, month - 1, selectedDay).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
              
              <div className={styles.focusContent}>
                {(() => {
                  const data = getDayData(selectedDay);
                  if (!data || (!data.tasks?.length && !data.habits?.length && !data.subscriptions?.length)) {
                    return (
                      <div className={styles.emptyFocus}>
                        <div className={styles.emptyIcon}>🌅</div>
                        <p>A clear day. Take a breather or plan ahead!</p>
                      </div>
                    );
                  }

                  let energyDemand = 0;
                  data.tasks?.forEach((t: any) => {
                    if (t.energyRequired === 'high') energyDemand += 3;
                    if (t.energyRequired === 'medium') energyDemand += 2;
                    if (t.energyRequired === 'low') energyDemand += 1;
                  });

                  return (
                    <>
                      {/* Energy Bar */}
                      <div className={styles.energySection}>
                        <div className={styles.energyHeader}>
                          <span>Energy Demand</span>
                          <span className={styles.energyScore}>{energyDemand} / 10</span>
                        </div>
                        <div className={styles.energyBarContainer}>
                          <div 
                            className={styles.energyBarFill} 
                            style={{ 
                              width: `${Math.min((energyDemand / 10) * 100, 100)}%`,
                              backgroundColor: energyDemand >= 8 ? 'var(--color-destructive)' : energyDemand >= 5 ? 'var(--color-warning)' : 'var(--color-success)'
                            }} 
                          />
                        </div>
                      </div>

                      {/* Tasks */}
                      {data.tasks && data.tasks.length > 0 && (
                        <div className={styles.focusSection}>
                          <h3>Tasks ({data.tasks.length})</h3>
                          <div className={styles.focusList}>
                            {data.tasks.map((t: any, i: number) => (
                              <div key={i} className={styles.focusItem}>
                                {t.status === 'done' ? <CheckCircle2 size={16} className={styles.iconDone} /> : <Clock size={16} className={styles.iconPending} />}
                                <span className={styles.itemTitle}>{t.title}</span>
                                {t.energyRequired && <span className={`${styles.badge} ${styles['badge' + t.energyRequired.charAt(0).toUpperCase() + t.energyRequired.slice(1)]}`}>{t.energyRequired}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Habits */}
                      {data.habits && data.habits.length > 0 && (
                        <div className={styles.focusSection}>
                          <h3>Habits Completed ({data.habits.length})</h3>
                          <div className={styles.focusList}>
                            {data.habits.map((h: any, i: number) => (
                              <div key={i} className={styles.focusItem}>
                                <CheckCircle2 size={16} className={styles.iconSuccess} />
                                <span className={styles.itemTitle}>{h.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Finance */}
                      {data.subscriptions && data.subscriptions.length > 0 && (
                        <div className={styles.focusSection}>
                          <h3>Financial Events ({data.subscriptions.length})</h3>
                          <div className={styles.focusList}>
                            {data.subscriptions.map((s: any, i: number) => (
                              <div key={i} className={styles.focusItem}>
                                <span className={styles.itemAmount}>${s.amount}</span>
                                <span className={styles.itemTitle}>{s.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className={styles.emptySidebar}>
              <CalendarIcon size={48} className={styles.emptySidebarIcon} />
              <p>Select a day to view its daily focus and energy demand.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
