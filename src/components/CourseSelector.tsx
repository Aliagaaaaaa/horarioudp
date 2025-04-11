import React, { useState, useMemo, ChangeEvent } from 'react';
import { getCourseId } from '../utils/helpers';
import { CourseEdge, CourseNode } from '../types/course';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddCourseModal from './AddCourseModal';
import { PlusCircle, ListFilter, GraduationCap } from 'lucide-react';

interface CourseSelectorProps {
  allCourses: CourseEdge[];
  selectedCourseIds: string[];
  onSelectionChange: (courseId: string, isChecked: boolean) => void;
  onCourseAdd: (course: CourseNode) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ 
  allCourses, 
  selectedCourseIds, 
  onSelectionChange,
  onCourseAdd
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'selected'>('all');

  const uniqueCourses = useMemo<CourseNode[]>(() => {
    const courseMap = new Map<string, CourseNode>();
    allCourses.forEach(edge => {
      if (edge && edge.node) {
        const node = edge.node;
        const id = getCourseId(node);
        if (id && !id.startsWith('invalid-') && !courseMap.has(id)) {
          courseMap.set(id, node);
        }
      }
    });
    return Array.from(courseMap.values()).sort((a, b) => {
      const courseCompare = a.course.localeCompare(b.course);
      if (courseCompare !== 0) return courseCompare;
      const codeCompare = a.code.localeCompare(b.code);
       if (codeCompare !== 0) return codeCompare;
      return a.section - b.section;
    });
  }, [allCourses]);


  const handleCheckboxChange = (courseId: string, checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
        onSelectionChange(courseId, checked);
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getUniqueTeachers = (course: CourseNode) => {
    return Array.from(
      new Set(
        course.timeSlots
          .map(slot => slot.teacher)
          .filter(Boolean)
      )
    );
  };

  const filteredCourses = useMemo(() => {
    const searchFiltered = uniqueCourses.filter(course => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const teachersMatch = getUniqueTeachers(course).some(teacher => 
        (teacher ?? '').toLowerCase().includes(lowerSearchTerm)
      );
      
      return (
          course.course.toLowerCase().includes(lowerSearchTerm) ||
          course.code.toLowerCase().includes(lowerSearchTerm) ||
          teachersMatch ||
          String(course.section).includes(lowerSearchTerm)
      );
    });
    
    if (viewMode === 'selected') {
      return searchFiltered.filter(course => 
        selectedCourseIds.includes(getCourseId(course))
      );
    }
    
    return searchFiltered;
  }, [uniqueCourses, searchTerm, selectedCourseIds, viewMode]);

  const handleAddCourse = (course: CourseNode) => {
    onCourseAdd(course);
  };

  const selectedCount = useMemo(() => {
    return uniqueCourses.filter(course => 
      selectedCourseIds.includes(getCourseId(course))
    ).length;
  }, [uniqueCourses, selectedCourseIds]);

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Selecciona Tus Ramos</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Añadir curso</span>
        </Button>
      </div>
      
      <div className="space-y-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar por ramo, código, profesor..."
          className="w-full"
          value={searchTerm}
          onChange={handleSearchChange}
          aria-label="Buscar cursos"
        />
        
        <Tabs 
          defaultValue="all" 
          className="w-full"
          value={viewMode}
          onValueChange={(val) => setViewMode(val as 'all' | 'selected')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <ListFilter className="h-4 w-4" />
              <span>Todos los cursos</span>
            </TabsTrigger>
            <TabsTrigger value="selected" className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>Mis cursos ({selectedCount})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ScrollArea className="h-72 w-full rounded-md border p-2">
        {filteredCourses.length > 0 ? (
            filteredCourses.map(course => {
            const courseId = getCourseId(course);
            if (!courseId || courseId.startsWith('invalid-')) return null;

            const isSelected = selectedCourseIds.includes(courseId);
            const displaySection = typeof course.section === 'number' ? course.section : 1;
            const uniqueTeachers = getUniqueTeachers(course);
            
            return (
                <div key={courseId} className="flex items-center space-x-3 mb-3 p-2 hover:bg-accent rounded transition-colors">
                    <Checkbox
                        id={courseId}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCheckboxChange(courseId, checked)}
                        aria-labelledby={`${courseId}-label`}
                    />
                    <Label htmlFor={courseId} id={`${courseId}-label`} className="text-sm cursor-pointer flex-grow">
                        <span className="font-medium">{course.course}</span> ({course.code}-{displaySection})
                        <span className="text-xs text-muted-foreground block">
                            {uniqueTeachers.length > 0 ? (
                                <>Profesores: {uniqueTeachers.join(', ')}</>
                            ) : (
                                'Sin profesor asignado'
                            )}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {course.isManual && (
                            <Badge variant="outline">
                              Manual
                            </Badge>
                          )}
                        </div>
                    </Label>
                </div>
            );
            })
        ) : (
            <p className="text-sm text-muted-foreground p-2 text-center">
              {viewMode === 'selected' 
                ? "No has seleccionado ningún curso aún."
                : "No se encontraron ramos con ese criterio."
              }
            </p>
        )}
      </ScrollArea>

      <AddCourseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCourseAdd={handleAddCourse}
      />
    </div>
  );
}

export default CourseSelector;