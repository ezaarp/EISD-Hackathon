'use client';

import { useState } from 'react';
import { bulkCreateStudents } from '@/app/actions/secretary';
import { PixelCard, PixelButton } from '@/components/ui';

export default function BulkCreateForm() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await bulkCreateStudents(text);
      setResult(res);
      if (res.success) setText('');
    } catch (e) {
      alert('Error creating students');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PixelCard title="BULK CREATE STUDENTS" className="max-w-2xl">
      <p className="text-slate-400 mb-4 text-sm">
        Paste CSV data here. Format per line: <code className="bg-slate-700 px-1 text-white">NIM,Name,Email</code> (Name & Email optional)
      </p>
      
      <textarea
        className="w-full h-64 bg-slate-900 border-2 border-slate-700 p-4 font-mono text-sm text-white mb-4 focus:border-indigo-500 outline-none"
        placeholder={`120220001,Budi Santoso,budi@student.telkomuniversity.ac.id\n120220002,Siti Aminah\n120220003`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex justify-end">
        <PixelButton onClick={handleSubmit} disabled={isLoading || !text}>
          {isLoading ? 'PROCESSING...' : 'CREATE ACCOUNTS'}
        </PixelButton>
      </div>

      {result && (
        <div className="mt-6 p-4 border-2 border-slate-700 bg-slate-800">
          <h3 className="font-bold mb-2 text-white">Result</h3>
          <p className="text-emerald-400">Success: {result.createdCount}</p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-rose-400 font-bold">Errors:</p>
              <ul className="list-disc list-inside text-xs text-rose-300">
                {result.errors.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PixelCard>
  );
}

