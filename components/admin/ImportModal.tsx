'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileJson, FileArchive, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ processed: number; errors: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/import/mock-exam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
      setFile(null);
      setResult(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
      if (!loading) {
          onClose();
          reset();
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            Import Mock Exam Data
          </DialogTitle>
          <DialogDescription className="text-slate-400">
             Upload a ZIP file containing question JSONs or a single JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {!result ? (
                <div 
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                        file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".zip,.json"
                        onChange={handleFileChange}
                    />
                    
                    {file ? (
                        <div className="text-center space-y-2">
                             {file.name.endsWith('.zip') ? (
                                 <FileArchive className="w-12 h-12 text-indigo-400 mx-auto" />
                             ) : (
                                 <FileJson className="w-12 h-12 text-cyan-400 mx-auto" />
                             )}
                             <p className="font-mono text-sm text-slate-300 break-all">{file.name}</p>
                             <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <UploadCloud className="w-12 h-12 text-slate-600 mx-auto group-hover:text-slate-500" />
                            <p className="text-sm text-slate-400 font-medium">Click to select file</p>
                            <p className="text-xs text-slate-600 uppercase tracking-widest">ZIP or JSON supported</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-400">Import Successful!</h3>
                        <p className="text-slate-400 text-sm mt-1">Processed <span className="text-white font-mono">{result.processed}</span> questions.</p>
                        {result.errors.length > 0 && (
                            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded text-left">
                                <p className="text-xs text-rose-400 font-bold mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {result.errors.length} Errors occurred:
                                </p>
                                <ul className="text-[10px] text-rose-300/80 font-mono list-disc pl-4 space-y-0.5 max-h-20 overflow-y-auto">
                                    {result.errors.map((e: any, i: number) => (
                                        <li key={i}>{e.file}: {e.error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={handleClose} disabled={loading} className="text-slate-400 hover:text-white">
                {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
                <Button 
                    onClick={handleUpload} 
                    disabled={!file || loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        'Run Import'
                    )}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
