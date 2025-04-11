import React, { useState } from "react";
import { CourseNode } from "../types/course";
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

const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onCourseAdd }) => {
  const [formData, setFormData] = useState<Partial<CourseNode>>({
    code: "",
    section: 1,
    course: "",
    place: "",
    start: "08:30",
    finish: "10:00",
    day: 1, // Default day for backwards compatibility
    teacher: "",
    isManual: true,
  });

  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Default to Monday

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "section" ? parseInt(value, 10) : value,
    }));
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (
      !formData.code ||
      !formData.course ||
      !formData.start ||
      !formData.finish ||
      selectedDays.length === 0
    ) {
      alert("Por favor completa todos los campos obligatorios y selecciona al menos un día.");
      return;
    }

    // Create course base with all required fields
    const courseBase: Omit<CourseNode, 'day'> = {
      code: formData.code || "",
      section: formData.section || 1,
      course: formData.course || "",
      place: formData.place || "No definido",
      start: formData.start || "00:00",
      finish: formData.finish || "00:00",
      days: selectedDays,
      teacher: formData.teacher || "No definido",
      isManual: true,
    };

    // For each selected day, create a course instance
    if (selectedDays.length === 1) {
      // If only one day is selected, use the simple approach
      const newCourse: CourseNode = {
        ...courseBase,
        day: selectedDays[0],
      };
      onCourseAdd(newCourse);
    } else {
      // For multiple days, create individual courses
      selectedDays.forEach(day => {
        const newCourse: CourseNode = {
          ...courseBase,
          day: day,
        };
        onCourseAdd(newCourse);
      });
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      section: 1,
      course: "",
      place: "",
      start: "08:30",
      finish: "10:00",
      day: 1,
      teacher: "",
      isManual: true,
    });
    setSelectedDays([1]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir curso manualmente</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del curso para añadirlo a tu horario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código del curso*</Label>
              <Input
                id="code"
                name="code"
                placeholder="Ej: CIT1337"
                value={formData.code}
                onChange={handleChange}
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
                value={formData.section}
                onChange={handleChange}
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
              value={formData.course}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Hora de inicio*</Label>
              <Input
                id="start"
                name="start"
                type="time"
                value={formData.start}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="finish">Hora de término*</Label>
              <Input
                id="finish"
                name="finish"
                type="time"
                value={formData.finish}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Días de la semana*</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => handleDayToggle(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Selecciona al menos un día</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="place">Sala/Lugar</Label>
            <Input
              id="place"
              name="place"
              placeholder="Ej: Sala 301"
              value={formData.place}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Profesor</Label>
            <Input
              id="teacher"
              name="teacher"
              placeholder="Nombre del profesor"
              value={formData.teacher}
              onChange={handleChange}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={onClose} variant="outline" type="button">Cancelar</Button>
            <Button type="submit" disabled={selectedDays.length === 0}>Añadir curso</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;
