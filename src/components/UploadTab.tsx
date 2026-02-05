import { useCallback, useState, useMemo } from 'react';
import { useApp } from '../hooks';
import { Upload, FileText, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export function UploadTab() {
  const { state, uploadFile, removeFile, clearAllData } = useApp();
  const { uploadedFiles, isLoading, error } = state;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Create a stable array copy of PDF files before processing
      // This ensures file references remain valid throughout the async loop
      const filesToProcess = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf'
      );

      for (const file of filesToProcess) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;

      // Create a stable array copy of files before processing
      // This prevents any issues with FileList being modified during iteration
      const filesToProcess = Array.from(fileList);
      
      // Reset input immediately to allow re-selecting same files
      e.target.value = '';

      for (const file of filesToProcess) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      removeFile(fileId);
    },
    [removeFile]
  );

  const flugstundenFiles = useMemo(
    () => uploadedFiles.filter((f) => f.type === 'flugstunden'),
    [uploadedFiles]
  );
  const streckeneinsatzFiles = useMemo(
    () => uploadedFiles.filter((f) => f.type === 'streckeneinsatz'),
    [uploadedFiles]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Dokumente hochladen
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Laden Sie Ihre Flugstundenübersicht und Streckeneinsatzabrechnung als
          PDF-Dateien hoch.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-4">
          <div
            className={`p-4 rounded-full ${
              isDragging ? 'bg-blue-100 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-700'
            }`}
          >
            <Upload
              className={`w-8 h-8 ${
                isDragging ? 'text-blue-600' : 'text-slate-400'
              }`}
            />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
              {isDragging
                ? 'Datei hier ablegen'
                : 'PDF-Dateien hierher ziehen oder klicken'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Unterstützte Dokumente: Flugstundenübersicht,
              Streckeneinsatzabrechnung
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700 dark:text-blue-300">
            Verarbeite Dokument...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">
              Fehler beim Hochladen
            </p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Flugstundenübersicht */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Flugstundenübersicht
          </h3>
          {flugstundenFiles.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Noch keine Dateien hochgeladen
            </p>
          ) : (
            <ul className="space-y-2">
              {flugstundenFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 flex-shrink-0">
                      {file.month}/{file.year}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 break-all">
                      ({file.name})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Streckeneinsatzabrechnung */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Streckeneinsatzabrechnung
          </h3>
          {streckeneinsatzFiles.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Noch keine Dateien hochgeladen
            </p>
          ) : (
            <ul className="space-y-2">
              {streckeneinsatzFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 flex-shrink-0">
                      {file.month}/{file.year}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 break-all">
                      ({file.name})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Clear All Button */}
      {uploadedFiles.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={clearAllData}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Alle Daten löschen
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Hinweis
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            Die <strong>Flugstundenübersicht</strong> enthält Ihre Flugzeiten und
            Arbeitstage
          </li>
          <li>
            Die <strong>Streckeneinsatzabrechnung</strong> enthält bereits
            erstattete Verpflegungspauschalen
          </li>
          <li>
            Laden Sie alle Monate eines Jahres hoch für eine vollständige
            Berechnung
          </li>
          <li>Ihre Daten werden nur lokal in Ihrem Browser verarbeitet</li>
        </ul>
      </div>
    </div>
  );
}
