import React from 'react';
import { CourseNode, TimeSlot } from '../types/course';
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
  
  // Handle whether we're using the new timeSlots array or legacy properties
  const hasTimeSlots = course.timeSlots && course.timeSlots.length > 0;
  
  // If using legacy format, create a single time slot from existing properties
  const effectiveTimeSlots: TimeSlot[] = hasTimeSlots 
    ? course.timeSlots!
    : [{ 
        day: course.day, 
        start: course.start, 
        finish: course.finish, 
        place: course.place 
      }];

  // Ensure section has a default value of 1 if undefined or null
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
        <CardDescription>{course.teacher}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm pt-2">
        {effectiveTimeSlots.map((slot, index) => (
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default CourseCard;