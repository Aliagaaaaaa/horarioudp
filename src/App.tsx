import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ScheduleView from './components/ScheduleView';
import CourseSelector from './components/CourseSelector';
import WeeklyCalendarView from './components/WeeklyCalendarView';
import ExportImportData from './components/ExportImportData';
import usePersistentState from './hooks/usePersistentState';
import { CourseEdge, ScheduleData, CourseNode } from './types/course';
import { Button } from "@/components/ui/button";
import { getCourseId } from './utils/helpers';

function deduplicateCourses(courseEdges: CourseEdge[]): CourseEdge[] {
  const uniqueMap = new Map<string, CourseEdge>();
  let combinedCount = 0;
  
  courseEdges.forEach(edge => {
    if (!edge.node || !edge.node.code) return;
    
    const courseKey = `${edge.node.code}|${edge.node.section || 1}`;
    
    if (!edge.node.timeSlots) {
      if ('day' in edge.node && 'start' in edge.node && 'finish' in edge.node && 'place' in edge.node) {
        const teacher = 'teacher' in edge.node ? (edge.node as any).teacher : "No definido";
        
        edge.node.timeSlots = [{
          day: (edge.node as any).day,
          start: (edge.node as any).start,
          finish: (edge.node as any).finish,
          place: (edge.node as any).place,
          teacher: teacher
        }];
        
        delete (edge.node as any).day;
        delete (edge.node as any).start;
        delete (edge.node as any).finish;
        delete (edge.node as any).place;
        delete (edge.node as any).teacher; 
      } else {
        edge.node.timeSlots = [];
      }
    } else {
      edge.node.timeSlots.forEach(slot => {
        if (!slot.teacher && 'teacher' in edge.node) {
          slot.teacher = (edge.node as any).teacher || "No definido";
        }
        
        if (!slot.teacher) {
          slot.teacher = "No definido";
        }
      });
      
      if ('teacher' in edge.node) {
        delete (edge.node as any).teacher;
      }
    }
    
    if (!uniqueMap.has(courseKey)) {
      uniqueMap.set(courseKey, {
        node: {
          ...edge.node,
          timeSlots: edge.node.timeSlots.map(slot => ({...slot}))
        }
      });
    } else {
      const existingEdge = uniqueMap.get(courseKey)!;
      const existingCourse = existingEdge.node;
      const newCourse = edge.node;
      
      combinedCount++;
        
      newCourse.timeSlots.forEach(newSlot => {
        const isDuplicate = existingCourse.timeSlots.some(existingSlot => 
          existingSlot.day === newSlot.day && 
          existingSlot.start === newSlot.start &&
          existingSlot.finish === newSlot.finish &&
          existingSlot.place === newSlot.place
        );
        
        if (!isDuplicate) {
          existingCourse.timeSlots.push({...newSlot});
        }
      });
      
      existingCourse.timeSlots.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.start.localeCompare(b.start);
      });
    }
  });
  
  let coursesWithMultipleTimeSlots = 0;
  uniqueMap.forEach(edge => {
    if (edge.node.timeSlots.length > 1) {
      coursesWithMultipleTimeSlots++;
    }
  });
  
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
      
      if (!edge.node.timeSlots) {
        if ('day' in edge.node && 'start' in edge.node && 'finish' in edge.node && 'place' in edge.node) {
          const teacher = 'teacher' in edge.node ? (edge.node as any).teacher : "No definido";
          
          edge.node.timeSlots = [{
            day: (edge.node as any).day,
            start: (edge.node as any).start,
            finish: (edge.node as any).finish,
            place: (edge.node as any).place,
            teacher: teacher
          }];
          
          delete (edge.node as any).day;
          delete (edge.node as any).start;
          delete (edge.node as any).finish;
          delete (edge.node as any).place;
          delete (edge.node as any).teacher;
        } else {
          edge.node.timeSlots = [];
        }
      }
      
      const courseId = getCourseId(edge.node);
      const existingCourse = updatedStoredCourses[courseId];
      
      edge.node.lastSeen = now;
      
      if (existingCourse) {
        let hasChanged = false;
        
        const timeSlotsChanged = (a: CourseNode, b: CourseNode) => {
          if (!a.timeSlots || !b.timeSlots) return true;
          if (a.timeSlots.length !== b.timeSlots.length) return true;
          
          const aSlotStrings = a.timeSlots.map(slot => 
            `${slot.day}|${slot.start}|${slot.finish}|${slot.place}|${slot.teacher || ''}`
          ).sort();
          
          const bSlotStrings = b.timeSlots.map(slot => 
            `${slot.day}|${slot.start}|${slot.finish}|${slot.place}|${slot.teacher || ''}`
          ).sort();
          
          for (let i = 0; i < aSlotStrings.length; i++) {
            if (aSlotStrings[i] !== bSlotStrings[i]) return true;
          }
          
          return false;
        };
        
        if (timeSlotsChanged(existingCourse, edge.node)) {
          hasChanged = true;
        }
        
        if (hasChanged) {
          edge.node.wasUpdated = true;
          updatedCourses.push(edge.node);
        }
        
        const combinedTimeSlots = [...edge.node.timeSlots];
        
        if (existingCourse.timeSlots) {
          existingCourse.timeSlots.forEach(existingSlot => {
            const isDuplicate = combinedTimeSlots.some(newSlot => 
              newSlot.day === existingSlot.day &&
              newSlot.start === existingSlot.start &&
              newSlot.finish === existingSlot.finish &&
              newSlot.place === existingSlot.place
            );
            
            if (!isDuplicate) {
              combinedTimeSlots.push({...existingSlot});
            }
          });
        }
        
        updatedStoredCourses[courseId] = {
          ...edge.node,
          timeSlots: combinedTimeSlots
        };
      } else {
        updatedStoredCourses[courseId] = edge.node;
      }
    });
    
    Object.entries(updatedStoredCourses).forEach(([id, course]) => {
      if (course.lastSeen !== now && selectedCourseIdsRef.current.includes(id)) {
        uniqueApiEdges.push({ node: { ...course } });
      }
    });
    
    setStoredApiCourses(updatedStoredCourses);
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

  const handleImportData = useCallback((data: { selectedCourseIds: string[]; manualCourses: CourseNode[] }) => {
    setManualCourses(data.manualCourses);
    setSelectedCourseIds(data.selectedCourseIds);
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
          <ExportImportData 
            selectedCourseIds={selectedCourseIds}
            manualCourses={manualCourses}
            onImport={handleImportData}
          />
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