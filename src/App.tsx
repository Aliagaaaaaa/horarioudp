import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ScheduleView from './components/ScheduleView';
import CourseSelector from './components/CourseSelector';
import WeeklyCalendarView from './components/WeeklyCalendarView';
import usePersistentState from './hooks/usePersistentState';
import { CourseEdge, ScheduleData, CourseNode } from './types/course';
import { Button } from "@/components/ui/button";
import { getCourseId } from './utils/helpers';

type ViewState = 'today' | 'week' | 'selector';

function App() {
  const [allCourses, setAllCourses] = useState<CourseEdge[]>([]);
  const [manualCourses, setManualCourses] = usePersistentState<CourseNode[]>('manualCourses', []);
  // Add a persistent store for all API courses that have been seen
  const [storedApiCourses, setStoredApiCourses] = usePersistentState<Record<string, CourseNode>>('storedApiCourses', {});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = usePersistentState<string[]>('selectedCourses', []);
  const [currentView, setCurrentView] = useState<ViewState>('today');

  // Use refs to avoid dependency cycles with stored values
  const storedApiCoursesRef = useRef(storedApiCourses);
  const selectedCourseIdsRef = useRef(selectedCourseIds);

  // Update refs when values change
  useEffect(() => {
    storedApiCoursesRef.current = storedApiCourses;
  }, [storedApiCourses]);

  useEffect(() => {
    selectedCourseIdsRef.current = selectedCourseIds;
  }, [selectedCourseIds]);

  const dataUrl = 'http://raw.githubusercontent.com/elmalba/data/refs/heads/main/dataa.json';

  // Process API data and merge with stored data
  const processApiData = useCallback((apiEdges: CourseEdge[]) => {
    const now = Date.now();
    const updatedStoredCourses = { ...storedApiCoursesRef.current };
    const updatedCourses: CourseNode[] = [];
    
    // Process each course from API
    apiEdges.forEach(edge => {
      if (!edge.node || !edge.node.code) return;
      
      const courseId = getCourseId(edge.node);
      const existingCourse = updatedStoredCourses[courseId];
      
      // Mark the current timestamp
      edge.node.lastSeen = now;
      
      if (existingCourse) {
        // Check if any important fields have changed
        const hasChanged = 
          existingCourse.place !== edge.node.place ||
          existingCourse.start !== edge.node.start || 
          existingCourse.finish !== edge.node.finish ||
          existingCourse.day !== edge.node.day ||
          existingCourse.teacher !== edge.node.teacher;
          
        if (hasChanged) {
          // If changed, mark as updated and preserve any days info we had before
          edge.node.wasUpdated = true;
          if (existingCourse.days) {
            edge.node.days = [...existingCourse.days];
          }
          updatedCourses.push(edge.node);
        }
        
        // Update the stored course
        updatedStoredCourses[courseId] = {
          ...edge.node,
          // Preserve days data if it exists
          days: existingCourse.days || edge.node.days
        };
      } else {
        // New course, add to stored courses
        updatedStoredCourses[courseId] = edge.node;
      }
    });
    
    // Look for courses that were in the stored data but not in the new API data
    // These might be courses that are not showing up in the API temporarily
    Object.entries(updatedStoredCourses).forEach(([id, course]) => {
      // If the course wasn't seen in this update but is selected
      if (course.lastSeen !== now && selectedCourseIdsRef.current.includes(id)) {
        // Include this course in the API edges so it's still visible
        apiEdges.push({ node: { ...course } });
      }
    });
    
    // Save the updated stored courses
    setStoredApiCourses(updatedStoredCourses);
    
    // If any courses were updated and are in the selected list, notify user
    // This could be enhanced with a toast notification
    const updatedSelectedCourses = updatedCourses
      .filter(course => selectedCourseIdsRef.current.includes(getCourseId(course)));
    
    if (updatedSelectedCourses.length > 0) {
      console.log("Updated courses in your selection:", updatedSelectedCourses);
      // You could add a toast notification here
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
            const validEdges = jsonData.data.allSalasUdps.edges.filter(edge =>
                edge?.node?.code && typeof edge.node.section === 'number'
            );
            
            // Process API data and merge with stored data
            processApiData(validEdges);
            
            // Update allCourses state
            setAllCourses(validEdges);
        } else {
            console.error("Data structure validation failed:", jsonData);
            throw new Error("La estructura de los datos recibidos no es la esperada.");
        }
      } catch (e: unknown) {
        console.error("Error al obtener los datos de los cursos:", e);
        
        // Use stored data without setting an error
        const storedCourseEdges = Object.values(storedApiCoursesRef.current).map(node => ({ node }));
        if (storedCourseEdges.length > 0) {
          console.log("Using stored course data instead");
          setAllCourses(storedCourseEdges);
        } else {
          // Only set error if there's no stored data to fall back to
          setError(e instanceof Error ? `No se pudieron cargar los datos: ${e.message}` : "Error desconocido.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Remove storedApiCourses and selectedCourseIds from dependencies 
    // and use refs instead
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
    // Generate a unique ID for the manual course
    const courseId = getCourseId(course);
    
    // Add the course to manual courses
    setManualCourses(prev => [...prev, course]);
    
    // Also select it
    setSelectedCourseIds(prev => {
      if (!prev.includes(courseId)) {
        return [...prev, courseId];
      }
      return prev;
    });
  }, [setManualCourses, setSelectedCourseIds]);

  // Combine API courses with manual courses
  const combinedCourses = useMemo(() => {
    const manualEdges = manualCourses.map(course => ({
      node: course
    }));
    return [...allCourses, ...manualEdges];
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
    <div className="container mx-auto p-4 font-sans max-w-6xl"> {/* Increased max-width for week view */}
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
            Datos obtenidos desde fuente externa. El horario puede estar sujeto a cambios.
      </footer>
    </div>
  );
}

export default App;