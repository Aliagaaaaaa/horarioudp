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
  place: string;
  start: string;
  finish: string;
  day: number;
  timeSlots?: TimeSlot[];
  isManual?: boolean;
  wasUpdated?: boolean; 
  lastSeen?: number;
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