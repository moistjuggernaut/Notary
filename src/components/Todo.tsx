import React, { useRef, useState } from 'react';
import { validatePhoto } from '../api/client';

export default function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      setFile(null);
      setPreview(null);
      return;
    }
    setError(null);
    setFile(file);
    setPreview(URL.createObjectURL(file));
    // Validate photo after upload
    try {
      const isValid = await validatePhoto(file);
      if (!isValid) {
        alert('The picture is invalid.');
        setFile(null);
        setPreview(null);
      }
    } catch (err) {
      setError('Failed to validate photo.');
      setFile(null);
      setPreview(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="image-upload-container">
      <h1 className="title">Upload a Picture</h1>
      <div
        className={`drop-zone${isDragging ? ' dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="preview-image" />
        ) : (
          <div className="drop-message">
            <span role="img" aria-label="upload" className="emoji">📷</span>
            <p>Drag & drop an image here, or <span className="browse-link">browse</span></p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: 'none' }}
          onChange={handleChange}
        />
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
} 