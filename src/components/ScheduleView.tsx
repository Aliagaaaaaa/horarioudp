import React from 'react';
import CourseCard from './CourseCard';
import { getCourseId, getCurrentDay, getDayName } from '../utils/helpers';
import { CourseEdge } from '../types/course';

interface ScheduleViewProps {
  allCourses: CourseEdge[];
  selectedCourseIds: string[];
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ allCourses, selectedCourseIds }) => {
  const currentDay = getCurrentDay();
  const locale = 'es-CL';

  const selectedCoursesToday = allCourses
    .filter(edge => edge.node && selectedCourseIds.includes(getCourseId(edge.node)))
    .map(edge => edge.node)
    .filter(course => course.day === currentDay)
    .sort((a, b) => a.start.localeCompare(b.start));

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
          course ? <CourseCard key={getCourseId(course)} course={course} /> : null
        ))
      )}
    </div>
  );
}

export default ScheduleView;