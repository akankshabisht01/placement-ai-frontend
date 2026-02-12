import React from 'react';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const FileUpload = ({ 
  onFileSelect,
  accept = '*',
  maxSize = 10, // MB
  file = null,
  onRemove,
  error,
  className,
  ...props
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSelectFile(droppedFile);
    }
  };
  
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSelectFile(selectedFile);
    }
  };
  
  const validateAndSelectFile = (selectedFile) => {
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }
    onFileSelect(selectedFile);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  return (
    <div className={cn('w-full', className)}>
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : error
                ? 'border-error-300 bg-error-50 hover:border-error-400'
                : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
            {...props}
          />
          
          <Upload className={cn(
            'mx-auto mb-4',
            isDragging ? 'text-primary-600' : error ? 'text-error-500' : 'text-gray-400'
          )} size={40} />
          
          <p className="text-base font-medium text-gray-700 mb-1">
            {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-gray-500">
            {accept === '.pdf' ? 'PDF files only' : accept === '.pdf,.doc,.docx,.txt' ? 'PDF, DOC, DOCX, or TXT' : 'Any file type'} (Max {maxSize}MB)
          </p>
        </div>
      ) : (
        <div className="relative border-2 border-primary-200 bg-primary-50 rounded-xl p-4 animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <File className="text-primary-600" size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
            
            <CheckCircle2 className="flex-shrink-0 text-success-500" size={20} />
            
            {onRemove && (
              <button
                onClick={onRemove}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-primary-100 text-gray-500 hover:text-error-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
