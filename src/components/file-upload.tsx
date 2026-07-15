"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentFile?: { name: string; url: string };
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  onFileSelect,
  currentFile,
  onFileRemove,
  accept = ".pdf,.doc,.docx",
  maxSize = 5,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error("Archivo muy grande", {
        description: `El archivo debe ser menor a ${maxSize}MB`,
      });
      return;
    }

    const allowedTypes = accept.split(",").map((type) => type.trim());
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Tipo de archivo no válido", {
        description: `Solo se permiten archivos: ${accept}`,
      });
      return;
    }

    onFileSelect(file);
    toast.success("Archivo seleccionado", {
      description: file.name,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (currentFile) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{currentFile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentFile.url, "_blank")}
              >
                Ver
              </Button>
              {onFileRemove && (
                <Button variant="ghost" size="sm" onClick={onFileRemove}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`cursor-pointer border-2 border-dashed transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <CardContent className="p-8 text-center">
        <Upload className="text-muted-foreground mx-auto mb-4 h-8 w-8" />
        <p className="mb-2 text-sm font-medium">
          Arrastra tu CV aquí o haz clic para seleccionar
        </p>
        <p className="text-muted-foreground text-xs">
          Formatos permitidos: {accept} (máx. {maxSize}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
