import React, { useState } from "react";
import { CourseNode, TimeSlot } from "../types/course";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseAdd: (course: CourseNode) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

interface TimeSlotFormData {
  day: number;
  start: string;
  finish: string;
  place: string;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onCourseAdd }) => {
  const [courseData, setCourseData] = useState<Partial<CourseNode>>({
    code: "",
    section: 1,
    course: "",
    teacher: "",
    isManual: true,
  });

  // Array of time slots for the course
  const [timeSlots, setTimeSlots] = useState<TimeSlotFormData[]>([
    { day: 1, start: "08:30", finish: "10:00", place: "" },
  ]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({
      ...prev,
      [name]: name === "section" ? parseInt(value, 10) : value,
    }));
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlotFormData, value: string | number) => {
    setTimeSlots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, { day: 1, start: "08:30", finish: "10:00", place: "" }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (
      !courseData.code ||
      !courseData.course ||
      timeSlots.length === 0
    ) {
      alert("Por favor completa todos los campos obligatorios y añade al menos un horario.");
      return;
    }

    // Validate each time slot
    for (const slot of timeSlots) {
      if (!slot.start || !slot.finish) {
        alert("Por favor completa las horas de inicio y término para todos los horarios.");
        return;
      }
    }

    // Create the new course with time slots
    const newCourse: CourseNode = {
      code: courseData.code || "",
      section: courseData.section || 1,
      course: courseData.course || "",
      teacher: courseData.teacher || "No definido",
      isManual: true,
      // Legacy fields - use the first time slot for compatibility
      day: timeSlots[0].day,
      start: timeSlots[0].start,
      finish: timeSlots[0].finish,
      place: timeSlots[0].place || "No definido",
      // New timeSlots field with all time slots
      timeSlots: timeSlots.map(slot => ({
        day: slot.day,
        start: slot.start,
        finish: slot.finish,
        place: slot.place || "No definido"
      }))
    };

    onCourseAdd(newCourse);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCourseData({
      code: "",
      section: 1,
      course: "",
      teacher: "",
      isManual: true,
    });
    setTimeSlots([
      { day: 1, start: "08:30", finish: "10:00", place: "" }
    ]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir curso manualmente</DialogTitle>
          <DialogDescription>
            Ingresa la información de tu curso para agregarlo al horario. Los cursos pueden tener múltiples días con diferentes horarios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Información del curso</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código del curso*</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="Ej: CIT1337"
                  value={courseData.code}
                  onChange={handleCourseChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section">Sección</Label>
                <Input
                  id="section"
                  name="section"
                  type="number"
                  min="1"
                  value={courseData.section}
                  onChange={handleCourseChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Nombre del curso*</Label>
              <Input
                id="course"
                name="course"
                placeholder="Nombre del curso"
                value={courseData.course}
                onChange={handleCourseChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Profesor</Label>
              <Input
                id="teacher"
                name="teacher"
                placeholder="Nombre del profesor"
                value={courseData.teacher}
                onChange={handleCourseChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Horarios del curso</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addTimeSlot}
                className="h-8"
              >
                <Plus className="mr-1 h-4 w-4" />
                Añadir horario
              </Button>
            </div>

            {timeSlots.map((slot, index) => (
              <div key={index} className="p-3 border rounded-md space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Horario {index + 1}</h4>
                  {timeSlots.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeTimeSlot(index)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Día de la semana*</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${index}-${day.value}`}
                            checked={slot.day === day.value}
                            onCheckedChange={() => handleTimeSlotChange(index, "day", day.value)}
                          />
                          <Label htmlFor={`day-${index}-${day.value}`} className="text-sm cursor-pointer">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`start-${index}`}>Hora de inicio*</Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={slot.start}
                        onChange={(e) => handleTimeSlotChange(index, "start", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`finish-${index}`}>Hora de término*</Label>
                      <Input
                        id={`finish-${index}`}
                        type="time"
                        value={slot.finish}
                        onChange={(e) => handleTimeSlotChange(index, "finish", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`place-${index}`}>Sala/Lugar</Label>
                    <Input
                      id={`place-${index}`}
                      placeholder="Ej: Sala 301"
                      value={slot.place}
                      onChange={(e) => handleTimeSlotChange(index, "place", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={onClose} variant="outline" type="button">Cancelar</Button>
            <Button type="submit">Añadir curso</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;
