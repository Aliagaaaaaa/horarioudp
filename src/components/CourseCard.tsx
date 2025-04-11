import React from 'react';
import { CourseNode } from '../types/course';
import { formatTime, getDayName } from '../utils/helpers';
import {
  Card,
  CardContent,
  CardDescription,
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
  const displayDay = getDayName(course.day, locale);

  return (
    <Card className="mb-4 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{course.course} ({course.code}-{course.section})</CardTitle>
          <div className="flex gap-2">
            {course.isManual && (
              <Badge variant="outline">
                Manual
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>{course.teacher}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm pt-2">
        <p>
          <span className="font-medium">Hora:</span> {formatTime(course.start)} - {formatTime(course.finish)}
        </p>
        <p>
          <span className="font-medium">Día:</span> {displayDay}
        </p>
        <p>
          <span className="font-medium">Sala:</span> {course.place}
        </p>
      </CardContent>
    </Card>
  );
}

export default CourseCard;