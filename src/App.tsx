import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ScheduleView from './components/ScheduleView';
import CourseSelector from './components/CourseSelector';
import WeeklyCalendarView from './components/WeeklyCalendarView';
import usePersistentState from './hooks/usePersistentState';
import { CourseEdge, ScheduleData, CourseNode } from './types/course';
import { Button } from "@/components/ui/button";
import { getCourseId } from './utils/helpers';

function getCourseUniqueKey(course: CourseNode): string {
  return [
    course.code || '',
    typeof course.section === 'number' ? course.section : 1,
    course.course || '',
    course.teacher || '',
    course.day || 0,
    course.start || '',
    course.finish || '',
    course.place || ''
  ].join('|');
}

function deduplicateCourses(courseEdges: CourseEdge[]): CourseEdge[] {
  const uniqueMap = new Map<string, CourseEdge>();
  const duplicates: string[] = [];
  
  courseEdges.forEach(edge => {
    if (!edge.node) return;
    
    const uniqueKey = getCourseUniqueKey(edge.node);
    
    if (!uniqueMap.has(uniqueKey)) {
      uniqueMap.set(uniqueKey, edge);
    } else {
      const existingCourse = uniqueMap.get(uniqueKey)?.node;
      console.log('Duplicate course detected:', {
        code: edge.node.code,
        section: edge.node.section,
        name: edge.node.course,
        day: edge.node.day,
        time: `${edge.node.start}-${edge.node.finish}`,
        existing: existingCourse ? {
          code: existingCourse.code,
          section: existingCourse.section,
          name: existingCourse.course
        } : 'unknown'
      });
      duplicates.push(uniqueKey);
    }
  });
  
  if (duplicates.length > 0) {
    console.log(`Removed ${duplicates.length} duplicate courses`);
  }
  
  return Array.from(uniqueMap.values());
}

type ViewState = 'today' | 'week' | 'selector';

function App() {
  const [allCourses, setAllCourses] = useState<CourseEdge[]>([]);
  const [manualCourses, setManualCourses] = usePersistentState<CourseNode[]>('manualCourses', []);
  const [storedApiCourses, setStoredApiCourses] = usePersistentState<Record<string, CourseNode>>('storedApiCourses', {});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = usePersistentState<string[]>('selectedCourses', []);
  const [currentView, setCurrentView] = useState<ViewState>('today');

  const storedApiCoursesRef = useRef(storedApiCourses);
  const selectedCourseIdsRef = useRef(selectedCourseIds);

  useEffect(() => {
    storedApiCoursesRef.current = storedApiCourses;
  }, [storedApiCourses]);

  useEffect(() => {
    selectedCourseIdsRef.current = selectedCourseIds;
  }, [selectedCourseIds]);

  const dataUrl = 'https://raw.githubusercontent.com/elmalba/data/refs/heads/main/data.json';

  const processApiData = useCallback((apiEdges: CourseEdge[]) => {
    const now = Date.now();
    const updatedStoredCourses = { ...storedApiCoursesRef.current };
    const updatedCourses: CourseNode[] = [];
    
    const uniqueApiEdges = deduplicateCourses(apiEdges);
    
    uniqueApiEdges.forEach(edge => {
      if (!edge.node || !edge.node.code) return;
      
      const courseId = getCourseId(edge.node);
      const existingCourse = updatedStoredCourses[courseId];
      
      edge.node.lastSeen = now;
      
      if (existingCourse) {
        const hasChanged = 
          existingCourse.place !== edge.node.place ||
          existingCourse.start !== edge.node.start || 
          existingCourse.finish !== edge.node.finish ||
          existingCourse.day !== edge.node.day ||
          existingCourse.teacher !== edge.node.teacher;
          
        if (hasChanged) {
          edge.node.wasUpdated = true;
          if (existingCourse.timeSlots) {
            edge.node.timeSlots = [...existingCourse.timeSlots];
          }
          updatedCourses.push(edge.node);
        }
        
        updatedStoredCourses[courseId] = {
          ...edge.node,
          timeSlots: existingCourse.timeSlots || edge.node.timeSlots
        };
      } else {
        if (!edge.node.timeSlots) {
          edge.node.timeSlots = [{
            day: edge.node.day,
            start: edge.node.start,
            finish: edge.node.finish,
            place: edge.node.place
          }];
        }
        updatedStoredCourses[courseId] = edge.node;
      }
    });
    
    Object.entries(updatedStoredCourses).forEach(([id, course]) => {
      if (course.lastSeen !== now && selectedCourseIdsRef.current.includes(id)) {
        uniqueApiEdges.push({ node: { ...course } });
      }
    });
    
    setStoredApiCourses(updatedStoredCourses);
    
    const updatedSelectedCourses = updatedCourses
      .filter(course => selectedCourseIdsRef.current.includes(getCourseId(course)));
    
    if (updatedSelectedCourses.length > 0) {
      console.log("Updated courses in your selection:", updatedSelectedCourses);
    }
  }, [setStoredApiCourses]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        const jsonData: ScheduleData = await response.json();
        if (
            jsonData?.data?.allSalasUdps?.edges &&
            Array.isArray(jsonData.data.allSalasUdps.edges)
            ) {
            const processedEdges = jsonData.data.allSalasUdps.edges
              .filter(edge => edge?.node?.code)
              .map(edge => {
                if (edge.node && edge.node.code && edge.node.section === undefined) {
                  return {
                    ...edge,
                    node: {
                      ...edge.node,
                      section: 1
                    }
                  };
                }
                return edge;
              });
            
            const uniqueEdges = deduplicateCourses(processedEdges);
            
            processApiData(uniqueEdges);
            
            setAllCourses(uniqueEdges);
        } else {
            console.error("Data structure validation failed:", jsonData);
            throw new Error("La estructura de los datos recibidos no es la esperada.");
        }
      } catch (e: unknown) {
        console.error("Error al obtener los datos de los cursos:", e);
        
        const storedCourseEdges = Object.values(storedApiCoursesRef.current).map(node => ({ node }));
        if (storedCourseEdges.length > 0) {
          console.log("Using stored course data instead");
          setAllCourses(deduplicateCourses(storedCourseEdges));
        } else {
          setError(e instanceof Error ? `No se pudieron cargar los datos: ${e.message}` : "Error desconocido.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dataUrl, processApiData]);

  const handleSelectionChange = useCallback((courseId: string, isChecked: boolean) => {
    setSelectedCourseIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isChecked) {
        newIds.add(courseId);
      } else {
        newIds.delete(courseId);
      }
      return Array.from(newIds);
    });
  }, [setSelectedCourseIds]);

  const handleAddManualCourse = useCallback((course: CourseNode) => {
    const courseId = getCourseId(course);
    
    setManualCourses(prev => [...prev, course]);
    
    setSelectedCourseIds(prev => {
      if (!prev.includes(courseId)) {
        return [...prev, courseId];
      }
      return prev;
    });
  }, [setManualCourses, setSelectedCourseIds]);

  const combinedCourses = useMemo(() => {
    const manualEdges = manualCourses.map(course => ({
      node: course
    }));
    return deduplicateCourses([...allCourses, ...manualEdges]);
  }, [allCourses, manualCourses]);

   if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen text-lg text-muted-foreground">
            Cargando horario...
        </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto p-4">
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md" role="alert">
                <h3 className="font-semibold">Error</h3>
                <p>{error}</p>
                 <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                    Intentar de nuevo
                </Button>
            </div>
        </div>
    );
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'today':
        return <ScheduleView allCourses={combinedCourses} selectedCourseIds={selectedCourseIds} />;
      case 'week':
        return <WeeklyCalendarView allCourses={combinedCourses} selectedCourseIds={selectedCourseIds} />;
      case 'selector':
        return <CourseSelector
                  allCourses={combinedCourses}
                  selectedCourseIds={selectedCourseIds}
                  onSelectionChange={handleSelectionChange}
                  onCourseAdd={handleAddManualCourse}
                />;
      default:
        return <ScheduleView allCourses={combinedCourses} selectedCourseIds={selectedCourseIds} />;
    }
  }

  return (
    <div className="container mx-auto p-4 font-sans max-w-6xl">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
          Mi Horario de Clases
        </h1>
        <div className="flex flex-wrap justify-center sm:justify-end gap-2">
           <Button
            onClick={() => setCurrentView('today')}
            variant={currentView === 'today' ? 'secondary' : 'outline'}
            size="sm"
          >
            Hoy
          </Button>
          <Button
            onClick={() => setCurrentView('week')}
            variant={currentView === 'week' ? 'secondary' : 'outline'}
            size="sm"
          >
            Semana
          </Button>
           <Button
            onClick={() => setCurrentView('selector')}
             variant={currentView === 'selector' ? 'secondary' : 'outline'}
             size="sm"
          >
            Seleccionar Ramos
          </Button>
        </div>
      </header>

      <main>
        {renderActiveView()}
      </main>

       <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>
              Proyecto opensource en <a href="https://github.com/Aliagaaaaaa/horarioudp" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">GitHub</a> • 
              Sígueme en <a href="https://x.com/aliaga1337" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">X (@aliaga1337)</a>
            </p>
      </footer>
    </div>
  );
}

export default App;