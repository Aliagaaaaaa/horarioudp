import React, { useMemo } from 'react';
import CourseCard from './CourseCard';
import { getCourseId, getCurrentDay, getDayName } from '../utils/helpers';
import { CourseEdge, CourseNode } from '../types/course';

interface ScheduleViewProps {
  allCourses: CourseEdge[];
  selectedCourseIds: string[];
}

function getTimeSlotUniqueKey(course: CourseNode, slotIndex: number): string {
  const slot = course.timeSlots[slotIndex];
  return `${course.code}|${course.section}|${slot.day}|${slot.start}|${slot.finish}|${slot.place}`;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ allCourses, selectedCourseIds }) => {
  const currentDay = getCurrentDay();
  const locale = 'es-CL';

  const selectedCoursesToday = useMemo(() => {
    const selectedCourses = allCourses
      .filter(edge => edge.node && selectedCourseIds.includes(getCourseId(edge.node)))
      .map(edge => edge.node);
    
    const coursesWithTodaySlots: CourseNode[] = [];
    const uniqueSlotMap = new Map<string, boolean>();
    
    selectedCourses.forEach(course => {
      const todaySlots = course.timeSlots.filter(slot => slot.day === currentDay);
      
      if (todaySlots.length > 0) {
        const courseCopy = {
          ...course,
          timeSlots: todaySlots
        };
        
        let hasUniqueSlots = false;
        
        courseCopy.timeSlots.forEach((_, index) => {
          const slotKey = getTimeSlotUniqueKey(courseCopy, index);
          if (!uniqueSlotMap.has(slotKey)) {
            uniqueSlotMap.set(slotKey, true);
            hasUniqueSlots = true;
          }
        });
        
        if (hasUniqueSlots) {
          coursesWithTodaySlots.push(courseCopy);
        }
      }
    });
    
    return coursesWithTodaySlots.sort((a, b) => {
      return a.timeSlots[0].start.localeCompare(b.timeSlots[0].start);
    });
  }, [allCourses, selectedCourseIds, currentDay]);

  const todayName = getDayName(currentDay, locale);

  return (
    <div className="p-1 md:p-4">
      <h2 className="text-2xl font-bold mb-4 capitalize">
        Horario de Hoy ({todayName})
      </h2>
      {selectedCoursesToday.length === 0 ? (
        <p className="text-muted-foreground">
          No tienes clases seleccionadas para hoy.
        </p>
      ) : (
        selectedCoursesToday.map(course => (
          <CourseCard 
            key={`${getCourseId(course)}-${course.timeSlots[0].start}`} 
            course={course} 
          />
        ))
      )}
    </div>
  );
}

export default ScheduleView;