'use client';

import { useState } from 'react';
import { deleteUser, updateUser } from '@/app/actions/user';
import { PixelButton } from '@/components/ui';
import { Trash, Edit, X, Save } from 'lucide-react';

export default function UserList({ users }: { users: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', username: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setIsLoading(true);
    await deleteUser(id);
    setIsLoading(false);
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, username: user.username });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsLoading(true);
    await updateUser(editingId, editForm);
    setEditingId(null);
    setIsLoading(false);
  };

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {users.length === 0 ? (
        <p className="text-slate-500 italic">No students yet.</p>
      ) : (
        users.map(student => (
          <div key={student.id} className="p-2 border-b border-slate-700 flex justify-between items-center group">
            {editingId === student.id ? (
              <div className="flex-1 flex gap-2">
                <input 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="bg-slate-900 border border-slate-600 p-1 text-xs text-white w-1/2"
                />
                <input 
                  value={editForm.username} 
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="bg-slate-900 border border-slate-600 p-1 text-xs text-white w-1/3"
                />
              </div>
            ) : (
              <div>
                <p className="font-bold text-white text-sm">{student.name}</p>
                <p className="text-xs text-slate-400">{student.username}</p>
              </div>
            )}

            <div className="flex gap-2">
              {editingId === student.id ? (
                <>
                  <button onClick={handleSave} disabled={isLoading} className="text-emerald-400 hover:text-emerald-300"><Save size={16} /></button>
                  <button onClick={() => setEditingId(null)} disabled={isLoading} className="text-slate-400 hover:text-slate-300"><X size={16} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(student)} className="text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(student.id)} disabled={isLoading} className="text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={16} /></button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

