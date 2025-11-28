'use client';

export default function PDFViewer({ url }: { url: string }) {
  // Use Google Docs Viewer for wider compatibility if needed, 
  // but for PDF files, direct browser viewing usually works via iframe 
  // if the server sends correct Content-Type (which Supabase does).
  
  return (
    <div className="w-full h-[600px] bg-slate-900 border-2 border-slate-700 overflow-hidden relative">
         {/* Fallback message */}
         <div className="absolute inset-0 flex items-center justify-center -z-10 text-slate-500">
             Loading PDF...
         </div>
        <iframe 
            src={url} 
            className="w-full h-full"
            title="PDF Viewer"
        />
    </div>
  );
}
