export interface CourseNode {
    code: string;
    section: number;
    course: string;
    place: string;
    start: string;
    finish: string;
    day: number;
    days?: number[];  // Support for multiple days
    teacher: string;
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