import React, { useMemo } from 'react';
import CourseCard from './CourseCard';
import { getCourseId, getCurrentDay, getDayName } from '../utils/helpers';
import { CourseEdge, CourseNode } from '../types/course';

interface ScheduleViewProps {
  allCourses: CourseEdge[];
  selectedCourseIds: string[];
}

function getDayTimeKey(course: CourseNode): string {
  return `${course.code}|${course.section}|${course.day}|${course.start}|${course.finish}|${course.place}`;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ allCourses, selectedCourseIds }) => {
  const currentDay = getCurrentDay();
  const locale = 'es-CL';

  const selectedCoursesToday = useMemo(() => {
    const selectedCourses = allCourses
      .filter(edge => edge.node && selectedCourseIds.includes(getCourseId(edge.node)))
      .map(edge => edge.node);
    
    const todayCourses = selectedCourses.filter(course => {
      if (course.timeSlots && course.timeSlots.length > 0) {
        return course.timeSlots.some(slot => slot.day === currentDay);
      }
      return course.day === currentDay;
    });
    
    const uniqueCourses = new Map<string, CourseNode>();
    
    todayCourses.forEach(course => {
      if (course.timeSlots && course.timeSlots.length > 0) {
        course.timeSlots
          .filter(slot => slot.day === currentDay)
          .forEach(slot => {
            const courseCopy = {
              ...course,
              day: slot.day,
              start: slot.start,
              finish: slot.finish,
              place: slot.place,
              timeSlots: [slot]
            };
            
            const uniqueKey = getDayTimeKey(courseCopy);
            if (!uniqueCourses.has(uniqueKey)) {
              uniqueCourses.set(uniqueKey, courseCopy);
            } else {
              console.log('Duplicate course prevented in today view:', 
                course.course, `${slot.start}-${slot.finish}`);
            }
          });
      } else {
        const uniqueKey = getDayTimeKey(course);
        if (!uniqueCourses.has(uniqueKey)) {
          uniqueCourses.set(uniqueKey, course);
        } else {
          console.log('Duplicate legacy course prevented in today view:', 
            course.course, `${course.start}-${course.finish}`);
        }
      }
    });
    
    return Array.from(uniqueCourses.values()).sort((a, b) => {
      const aStart = a.timeSlots?.[0]?.start || a.start;
      const bStart = b.timeSlots?.[0]?.start || b.start;
      return aStart.localeCompare(bStart);
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
            key={`${getCourseId(course)}-${course.timeSlots?.[0]?.start || course.start}`} 
            course={course} 
          />
        ))
      )}
    </div>
  );
}

export default ScheduleView;