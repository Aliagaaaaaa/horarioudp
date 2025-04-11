import React, { useMemo } from 'react';
import { CourseEdge, CourseNode, TimeSlot } from '../types/course';
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
    console.log("WeeklyCalendarView received courses:", allCourses.length);
    
    const selectedCourses = allCourses
      .filter(edge => edge?.node && selectedCourseIds.includes(getCourseId(edge.node)))
      .map(edge => edge.node);
    
    console.log("Selected courses count:", selectedCourses.length);
    
    const coursesWithMultipleTimeSlots = selectedCourses.filter(
      course => course.timeSlots && course.timeSlots.length > 1
    );
    
    console.log("Courses with multiple timeSlots:", coursesWithMultipleTimeSlots.length);
    if (coursesWithMultipleTimeSlots.length > 0) {
      const example = coursesWithMultipleTimeSlots[0];
      console.log("Example course with multiple slots:", {
        code: example.code,
        section: example.section,
        timeSlots: example.timeSlots.map(slot => ({
          day: slot.day,
          time: `${slot.start}-${slot.finish}`,
          place: slot.place
        }))
      });
    }

    const grouped: Record<number, CourseNode[]> = {};
    DAYS_TO_DISPLAY.forEach(dayNum => grouped[dayNum] = []);

    const courseByDayMap: Record<number, Map<string, CourseNode>> = {};
    DAYS_TO_DISPLAY.forEach(dayNum => courseByDayMap[dayNum] = new Map());

    selectedCourses.forEach(course => {
      if (!course.timeSlots || course.timeSlots.length === 0) {
        console.warn("Course without timeSlots found:", course.code, course.section);
        return;
      }
      
      const timeSlotsByDay: Record<number, TimeSlot[]> = {};
      
      course.timeSlots.forEach(slot => {
        if (!DAYS_TO_DISPLAY.includes(slot.day)) return;
        
        if (!timeSlotsByDay[slot.day]) {
          timeSlotsByDay[slot.day] = [];
        }
        timeSlotsByDay[slot.day].push(slot);
      });
      
      const dayCount = Object.keys(timeSlotsByDay).length;
      if (dayCount > 1) {
        console.log(`Course ${course.code}-${course.section} has timeSlots on ${dayCount} different days:`, 
          Object.entries(timeSlotsByDay).map(([day, slots]) => ({
            day,
            slotCount: slots.length
          }))
        );
      }
      
      Object.entries(timeSlotsByDay).forEach(([dayStr, slots]) => {
        const day = parseInt(dayStr);
        
        if (slots.length > 1) {
          console.log(`Course ${course.code}-${course.section} has multiple timeSlots on day ${day}:`,
            slots.map(slot => `${slot.start}-${slot.finish} at ${slot.place}`));
        }
        
        const courseCopy: CourseNode = {
          ...course,
          timeSlots: [...slots]
        };
        
        const courseKey = `${course.code}|${course.section}|${day}`;
        
        if (!courseByDayMap[day].has(courseKey)) {
          courseByDayMap[day].set(courseKey, courseCopy);
          grouped[day].push(courseCopy);
        } else {
          const existingCourse = courseByDayMap[day].get(courseKey)!;
          
          const existingSlotKeys = new Set(existingCourse.timeSlots.map(s => 
            `${s.start}|${s.finish}|${s.place}`));
            
          slots.forEach(slot => {
            const slotKey = `${slot.start}|${slot.finish}|${slot.place}`;
            if (!existingSlotKeys.has(slotKey)) {
              existingCourse.timeSlots.push({...slot});
              existingSlotKeys.add(slotKey);
            }
          });
          
          existingCourse.timeSlots.sort((a, b) => a.start.localeCompare(b.start));
          
          if (existingCourse.timeSlots.length > 1) {
            console.log(`After combining, course ${existingCourse.code}-${existingCourse.section} on day ${day} has ${existingCourse.timeSlots.length} timeSlots`);
          }
        }
      });
    });

    Object.keys(grouped).forEach(dayKeyStr => {
      const dayKey = parseInt(dayKeyStr, 10);
      if (grouped[dayKey]) {
        grouped[dayKey].sort((a, b) => {
          return a.timeSlots[0].start.localeCompare(b.timeSlots[0].start);
        });
      }
    });

    Object.entries(grouped).forEach(([day, courses]) => {
      console.log(`Day ${day}: ${courses.length} courses with the following timeSlot counts:`, 
        courses.map(c => ({
          code: c.code,
          section: c.section,
          timeSlotsCount: c.timeSlots.length
        }))
      );
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
                      key={`${getCourseId(course)}-${dayNumber}-${course.timeSlots.length}`} 
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