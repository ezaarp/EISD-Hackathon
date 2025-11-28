'use client';

export default function PDFViewer({ url }: { url: string }) {
  // Simple iframe viewer for hackathon speed. 
  // In production, use react-pdf or PDF.js for better control.
  
  // If URL is not absolute or from storage, we might need to sign it. 
  // For now assuming public URL from Supabase or static placeholder.
  
  const displayUrl = url.startsWith('http') ? url : `/api/file-proxy?path=${url}`; 
  // OR just direct if we are confident. 
  // Let's assume for the demo we use a placeholder if path is not a URL
  
  const finalUrl = url.includes('placeholder') 
    ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // reliable dummy pdf
    : url;

  return (
    <div className="w-full h-[500px] bg-slate-900 border-2 border-slate-700">
        <iframe 
            src={`${finalUrl}#toolbar=0`} 
            className="w-full h-full"
            title="PDF Viewer"
        />
    </div>
  );
}

