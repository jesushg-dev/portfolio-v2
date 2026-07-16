"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export interface FileUploadLabels {
  dropzoneTitle: string;
  dropzoneHint: string;
  view: string;
  fileTooLargeTitle: string;
  fileTooLargeDescription: string;
  invalidTypeTitle: string;
  invalidTypeDescription: string;
  selectedTitle: string;
}

const defaultLabels: FileUploadLabels = {
  dropzoneTitle: "Arrastra tu CV aquí o haz clic para seleccionar",
  dropzoneHint: "Formatos permitidos: {accept} (máx. {maxSize}MB)",
  view: "Ver",
  fileTooLargeTitle: "Archivo muy grande",
  fileTooLargeDescription: "El archivo debe ser menor a {maxSize}MB",
  invalidTypeTitle: "Tipo de archivo no válido",
  invalidTypeDescription: "Solo se permiten archivos: {accept}",
  selectedTitle: "Archivo seleccionado",
};

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentFile?: { name: string; url: string };
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  labels?: FileUploadLabels;
  showSelectionToast?: boolean;
}

export function FileUpload({
  onFileSelect,
  currentFile,
  onFileRemove,
  accept = ".pdf,.doc,.docx",
  maxSize = 5,
  labels: labelsProp,
  showSelectionToast = true,
}: FileUploadProps) {
  const labels = labelsProp ?? defaultLabels;
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(labels.fileTooLargeTitle, {
        description: labels.fileTooLargeDescription.replace(
          "{maxSize}",
          String(maxSize),
        ),
      });
      return;
    }

    const allowedTypes = accept.split(",").map((type) => type.trim());
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast.error(labels.invalidTypeTitle, {
        description: labels.invalidTypeDescription.replace("{accept}", accept),
      });
      return;
    }

    onFileSelect(file);
    if (showSelectionToast) {
      toast.success(labels.selectedTitle, {
        description: file.name,
      });
    }
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
              <File className="text-primary h-4 w-4" />
              <span className="text-sm font-medium">{currentFile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentFile.url, "_blank")}
              >
                {labels.view}
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
        <p className="text-foreground mb-2 text-sm font-medium">
          {labels.dropzoneTitle}
        </p>
        <p className="text-muted-foreground text-xs">
          {labels.dropzoneHint
            .replace("{accept}", accept)
            .replace("{maxSize}", String(maxSize))}
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
