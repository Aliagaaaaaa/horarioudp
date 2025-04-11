export interface TimeSlot {
  day: number;
  start: string;
  finish: string;
  place: string;
}

export interface CourseNode {
  code: string;
  section: number;
  course: string;
  teacher: string;
  // Legacy properties for backward compatibility
  place: string;
  start: string;
  finish: string;
  day: number;
  // New property for multiple days and time slots
  timeSlots?: TimeSlot[];
  isManual?: boolean;
  wasUpdated?: boolean; // Flag to identify recently updated courses
  lastSeen?: number;    // Timestamp when the course was last seen in API
}
  
export interface CourseEdge {
  node: CourseNode;
}
  
export interface ScheduleData {
  data: {
    allSalasUdps: {
      edges: CourseEdge[];
    };
  };
}