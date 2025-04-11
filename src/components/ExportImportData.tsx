import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Upload, Copy, Check } from 'lucide-react';
import { CourseNode } from '@/types/course';

interface ExportData {
  selectedCourseIds: string[];
  manualCourses: CourseNode[];
  version: number;
  exportDate: string;
}

interface ExportImportDataProps {
  selectedCourseIds: string[];
  manualCourses: CourseNode[];
  onImport: (data: { selectedCourseIds: string[]; manualCourses: CourseNode[] }) => void;
}

const ExportImportData: React.FC<ExportImportDataProps> = ({ selectedCourseIds, manualCourses, onImport }) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [exportCode, setExportCode] = useState<string>('');
  const [importCode, setImportCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleExport = () => {
    try {
      const dataToExport: ExportData = {
        selectedCourseIds,
        manualCourses,
        version: 1,
        exportDate: new Date().toISOString()
      };

      // Convertir a base64
      const jsonString = JSON.stringify(dataToExport);
      const base64String = btoa(jsonString);
      setExportCode(base64String);
      setMode('export');
      setIsDialogOpen(true);
      setError(null);
    } catch (e) {
      console.error('Error al exportar datos:', e);
      setError('Ocurrió un error al exportar los datos.');
    }
  };

  const handleImportClick = () => {
    setMode('import');
    setImportCode('');
    setError(null);
    setSuccess(null);
    setIsDialogOpen(true);
  };

  const handleImport = () => {
    try {
      if (!importCode.trim()) {
        setError('Por favor ingresa un código de importación.');
        return;
      }

      // Decodificar base64
      const jsonString = atob(importCode.trim());
      const importedData = JSON.parse(jsonString) as ExportData;

      // Validar estructura de datos
      if (!importedData.selectedCourseIds || !Array.isArray(importedData.selectedCourseIds) || 
          !importedData.manualCourses || !Array.isArray(importedData.manualCourses)) {
        throw new Error('El formato de los datos importados no es válido.');
      }

      onImport({
        selectedCourseIds: importedData.selectedCourseIds,
        manualCourses: importedData.manualCourses
      });

      setSuccess('Datos importados correctamente.');
      setError(null);
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (e) {
      console.error('Error al importar datos:', e);
      setError('El código de importación no es válido. Verifica que hayas copiado el código completo.');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Error al copiar al portapapeles:', e);
      setError('No se pudo copiar al portapapeles. Por favor copia el código manualmente.');
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          <span>Importar</span>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'export' ? 'Exportar configuración' : 'Importar configuración'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'export'
                ? 'Copia este código para importar tu configuración en otro dispositivo.'
                : 'Pega el código de configuración que exportaste desde otro dispositivo.'}
            </DialogDescription>
          </DialogHeader>

          {mode === 'export' ? (
            <div className="space-y-4">
              <div className="relative bg-muted p-3 rounded-md">
                <div className="overflow-x-auto">
                  <p className="font-mono text-xs break-all whitespace-normal">{exportCode}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={handleCopyToClipboard}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Este código contiene {manualCourses.length} cursos manuales y {selectedCourseIds.length} cursos seleccionados.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de importación</label>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value.trim())}
                  placeholder="Pega aquí el código de exportación..."
                  className="w-full h-24 px-3 py-2 text-xs font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary"
                  spellCheck="false"
                />
              </div>
              
              {error && (
                <div className="bg-destructive/10 p-2 rounded-md border-l-4 border-destructive text-sm text-destructive">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 p-2 rounded-md border-l-4 border-green-500 text-sm text-green-700">
                  {success}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {mode === 'export' ? (
              <Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleImport}>Importar</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportImportData;