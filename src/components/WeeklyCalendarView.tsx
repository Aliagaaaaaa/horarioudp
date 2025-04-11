import React, { useMemo } from 'react';
import { CourseEdge, CourseNode } from '../types/course';
import { getCourseId, getDayName } from '../utils/helpers';
import CourseCard from './CourseCard';

interface WeeklyCalendarViewProps {
  allCourses: CourseEdge[];
  selectedCourseIds: string[];
}
const DAYS_TO_DISPLAY: number[] = [1, 2, 3, 4, 5];

// Helper function to create a unique key for courses on the same day and time
function getDayTimeKey(course: CourseNode): string {
  return `${course.code}|${course.section}|${course.day}|${course.start}|${course.finish}|${course.place}`;
}

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({ allCourses, selectedCourseIds }) => {
  const locale = 'es-CL';

  const scheduleByDay = useMemo(() => {
    const selectedCourses = allCourses
      .filter(edge => edge?.node && selectedCourseIds.includes(getCourseId(edge.node)))
      .map(edge => edge.node);

    const grouped: Record<number, CourseNode[]> = {};
    DAYS_TO_DISPLAY.forEach(dayNum => grouped[dayNum] = []);

    // Use this map to track unique courses per day to prevent duplicates
    const dayUniqueCoursesMap: Record<number, Map<string, CourseNode>> = {};
    DAYS_TO_DISPLAY.forEach(dayNum => dayUniqueCoursesMap[dayNum] = new Map());

    selectedCourses.forEach(course => {
      // Check if the course uses the new timeSlots format
      if (course.timeSlots && course.timeSlots.length > 0) {
        // For each time slot, add the course to the corresponding day
        course.timeSlots.forEach(slot => {
          if (DAYS_TO_DISPLAY.includes(slot.day) && grouped[slot.day]) {
            // Create a copy of the course with only the relevant time slot
            const courseCopy = {
              ...course,
              // Override the legacy properties with the time slot data for proper display
              day: slot.day,
              start: slot.start,
              finish: slot.finish,
              place: slot.place,
              // Keep only this time slot in the timeSlots array
              timeSlots: [slot]
            };
            
            const uniqueKey = getDayTimeKey(courseCopy);
            const dayMap = dayUniqueCoursesMap[slot.day];
            
            // Only add if this exact course isn't already in this day
            if (!dayMap.has(uniqueKey)) {
              dayMap.set(uniqueKey, courseCopy);
              grouped[slot.day].push(courseCopy);
            } else {
              console.log('Duplicate course prevented in day view:', 
                course.course, slot.day, `${slot.start}-${slot.finish}`);
            }
          }
        });
      } else if (DAYS_TO_DISPLAY.includes(course.day)) {
        // Legacy mode - use the single day property
        if (grouped[course.day]) {
          const uniqueKey = getDayTimeKey(course);
          const dayMap = dayUniqueCoursesMap[course.day];
          
          // Only add if this exact course isn't already in this day
          if (!dayMap.has(uniqueKey)) {
            dayMap.set(uniqueKey, course);
            grouped[course.day].push(course);
          } else {
            console.log('Duplicate legacy course prevented in day view:', 
              course.course, course.day, `${course.start}-${course.finish}`);
          }
        }
      }
    });

    // Sort courses by start time for each day
    Object.keys(grouped).forEach(dayKeyStr => {
      const dayKey = parseInt(dayKeyStr, 10);
      if (grouped[dayKey]) {
        grouped[dayKey].sort((a, b) => {
          const aStart = a.timeSlots?.[0]?.start || a.start;
          const bStart = b.timeSlots?.[0]?.start || b.start;
          return aStart.localeCompare(bStart);
        });
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
                    <CourseCard 
                      key={`${getCourseId(course)}-${course.timeSlots?.[0]?.start || course.start}`} 
                      course={course}
                    />
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