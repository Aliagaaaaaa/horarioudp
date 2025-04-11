export interface TimeSlot {
  day: number;
  start: string;
  finish: string;
  place: string;
  teacher?: string;
}

export interface CourseNode {
  code: string;
  section: number;
  course: string;
  timeSlots: TimeSlot[];
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