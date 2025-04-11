import React, { useMemo } from 'react';
import { CourseEdge, CourseNode } from '../types/course';
import { getCourseId, getDayName } from '../utils/helpers';
import CourseCard from './CourseCard';

interface WeeklyCalendarViewProps {
  allCourses: CourseEdge[];
  selectedCourseIds: string[];
}
const DAYS_TO_DISPLAY: number[] = [1, 2, 3, 4, 5];

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({ allCourses, selectedCourseIds }) => {
  const locale = 'es-CL';

  const scheduleByDay = useMemo(() => {
    const selectedCourses = allCourses
      .filter(edge => edge?.node && selectedCourseIds.includes(getCourseId(edge.node)))
      .map(edge => edge.node);

    const grouped: Record<number, CourseNode[]> = {};
    DAYS_TO_DISPLAY.forEach(dayNum => grouped[dayNum] = []);

    selectedCourses.forEach(course => {
      if (course && DAYS_TO_DISPLAY.includes(course.day)) {
         if(grouped[course.day]){
            grouped[course.day].push(course);
         }
      }
    });

    Object.keys(grouped).forEach(dayKeyStr => {
        const dayKey = parseInt(dayKeyStr, 10);
        if(grouped[dayKey]){
           grouped[dayKey].sort((a, b) => a.start.localeCompare(b.start));
        }
    });

    return grouped;
  }, [allCourses, selectedCourseIds]);
  return (
    <div className="p-1 md:p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Horario Semanal</h2>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${DAYS_TO_DISPLAY.length} gap-4`}>
        {DAYS_TO_DISPLAY.map(dayNumber => {
          const dayName = getDayName(dayNumber, locale);
          const coursesForDay = scheduleByDay[dayNumber] || [];
          return (
            <div key={dayNumber} className="border rounded-lg p-3 bg-muted/30 min-h-[200px]">
              <h3 className="text-lg font-semibold mb-3 text-center capitalize border-b pb-2">
                {dayName}
              </h3>
              {coursesForDay.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Sin clases este día.
                </p>
              ) : (
                <div className="space-y-3">
                  {coursesForDay.map(course => (
                    course ? <CourseCard key={getCourseId(course)} course={course} /> : null
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendarView;