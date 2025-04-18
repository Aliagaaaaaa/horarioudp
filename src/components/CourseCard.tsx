import React from 'react';
import { CourseNode } from '../types/course';
import { formatTime, getDayName } from '../utils/helpers';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  course: CourseNode | null | undefined;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  if (!course) return null;

  const locale = 'es-CL';
  const displaySection = typeof course.section === 'number' ? course.section : 1;

  return (
    <Card className="mb-4 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{course.course} ({course.code}-{displaySection})</CardTitle>
          <div className="flex gap-2">
            {course.isManual && (
              <Badge variant="outline">
                Manual
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm pt-2">
        {course.timeSlots.map((slot, index) => (
          <div key={index} className={index > 0 ? "mt-2 pt-2 border-t" : ""}>
            <p>
              <span className="font-medium">Hora:</span> {formatTime(slot.start)} - {formatTime(slot.finish)}
            </p>
            <p>
              <span className="font-medium">Día:</span> {getDayName(slot.day, locale)}
            </p>
            <p>
              <span className="font-medium">Sala:</span> {slot.place}
            </p>
            {slot.teacher && (
              <p>
                <span className="font-medium">Profesor:</span> {slot.teacher}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default CourseCard;