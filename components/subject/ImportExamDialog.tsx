import { Upload, FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { subjectsApi } from '@/lib/api';
import { getCategoriesBySubject } from '@/lib/api';
import { setCategories } from '@/lib/store/slices/subjectsSlice';
import { type AppDispatch } from '@/lib/store';
import React, { useRef, useState } from 'react';

interface ImportExamDialogProps {
  subjectId: string;
  dispatch: AppDispatch;
}

export function ImportExamDialog({ subjectId, dispatch }: ImportExamDialogProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportMockExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setIsImporting(true);

    try {
      await subjectsApi.importMockExam(file, subjectId);

      // Refresh categories
      const categoriesData = await getCategoriesBySubject(subjectId);
      dispatch(setCategories(categoriesData));
      setIsImportOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to import mock exam. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-slate-900/80 border-slate-700/50 hover:bg-cyan-950/30 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all duration-300 group backdrop-blur-md shadow-lg shadow-black/20"
        >
          <Upload className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          <span className="text-xs font-bold tracking-wider font-mono">匯入模組</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-950/95 border-slate-800 text-slate-200 p-0 overflow-hidden max-w-md shadow-2xl shadow-cyan-900/20 backdrop-blur-xl">
        {/* Terminal Header */}
        <div className="bg-slate-900/80 border-b border-slate-800 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
            </div>
            <div className="h-4 w-[1px] bg-slate-700 mx-2" />
            <DialogTitle className="flex items-center gap-2 text-cyan-400 font-mono text-sm tracking-widest uppercase">
              <FileUp className="w-4 h-4" />
              IMPORT_MODULE.EXE
            </DialogTitle>
          </div>
        </div>

        <div className="p-6 space-y-6 relative">
          {/* Grid Background Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.6)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none z-0" />

          <div className="relative z-10 space-y-6">
            <DialogDescription className="text-slate-400 font-mono text-xs leading-relaxed border-l-2 border-slate-700 pl-3">
              &gt; 初始化上傳程序...
              <br />
              &gt; 請選擇包含模擬試題資料的 .zip 檔案。
              <br />
              &gt; 系統將自動解析並掛載至當前模組。
            </DialogDescription>

            <form onSubmit={handleImportMockExam} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 font-mono">
                  SOURCE_FILE_PATH
                </Label>

                {/* Custom File Input Trigger */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer"
                >
                  {/* Background & Border */}
                  <div className="absolute inset-0 bg-cyan-950/20 border border-slate-700 group-hover:border-cyan-500/50 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-right-bottom group-hover:bg-left-top transition-[background-position] duration-500" />

                  {/* Content */}
                  <div className="relative p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={cn(
                          'w-8 h-8 flex items-center justify-center border border-dashed transition-colors',
                          selectedFileName
                            ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30'
                            : 'border-slate-600 text-slate-600 group-hover:border-cyan-500/50 group-hover:text-cyan-400/70'
                        )}
                      >
                        <FileUp className="w-4 h-4" />
                      </div>
                      <div className="font-mono text-xs truncate">
                        {selectedFileName ? (
                          <span className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                            {selectedFileName}
                          </span>
                        ) : (
                          <span className="text-slate-500 group-hover:text-slate-400 transition-colors">
                            [ 點擊選擇檔案 (ZIP/JSON) ]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] transition-colors',
                        selectedFileName
                          ? 'bg-cyan-500 text-cyan-500'
                          : 'bg-slate-800 text-slate-800'
                      )}
                    />
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Hidden Native Input */}
                <Input
                  id="exam-file"
                  type="file"
                  accept=".zip,.json"
                  ref={fileInputRef}
                  className="hidden"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFileName(file.name);
                    else setSelectedFileName(null);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsImportOpen(false)}
                  className="font-mono text-xs hover:bg-red-950/20 hover:text-red-400 text-slate-500 transition-colors"
                >
                  [ CANCEL ]
                </Button>
                <Button
                  type="submit"
                  disabled={isImporting}
                  className="bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 font-mono text-xs tracking-wider min-w-[120px] shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)] transition-all"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <span>EXECUTE_UPLOAD</span>
                      <div className="ml-2 w-1.5 h-3 bg-cyan-400 animate-pulse" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
