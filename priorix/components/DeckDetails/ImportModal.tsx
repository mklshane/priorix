"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, deckId: string) => Promise<void>;
  deckId: string;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  deckId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
    }
  };

  const handleGenerate = async () => {
    if (selectedFile) {
      setIsImporting(true);
      try {
        await onImport(selectedFile, deckId);
        onClose();
        setSelectedFile(null);
      } catch (error) {
        console.error("Import failed:", error);
      } finally {
        setIsImporting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Import PDF to Create Flashcards
        </h2>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-violet bg-violet/10"
              : selectedFile
              ? "border-green bg-green/10"
              : "border-gray-300 dark:border-gray-600 hover:border-violet"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            className="hidden"
          />

          {selectedFile ? (
            <div className="text-primary dark:text-green/80">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm mt-1">Click to select a different file</p>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="font-medium">Drag & drop your PDF here</p>
              <p className="text-sm mt-1">or click to browse files</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedFile || isImporting}
            className="bg-purple text-primary border-2 border-primary disabled:opacity-50 hover:bg-purple/50"
          >
            {isImporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              "Generate Flashcards"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
