import React, { useState } from 'react';
import { FieldLabel } from './common';

interface MyIdManagerProps {
  myId: string | null;
  onSet: (v: string) => void;
}

export function MyIdManager({ myId, onSet }: MyIdManagerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(myId ?? "");

  // Update input when myId prop changes
  React.useEffect(() => {
    setInputValue(myId ?? "");
  }, [myId]);

  const handleSave = () => {
    onSet(inputValue);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button className="btn-secondary text-sm px-3 py-2" onClick={() => setOpen(!open)}>
        {myId ? `ID: ${myId}` : "ID festlegen"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-30">
          <div className="space-y-3">
            <FieldLabel>Besitzer ID</FieldLabel>
            <input 
              className="input" 
              placeholder="z.B. 12345" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e)=>{ 
                if(e.key==='Enter'){ 
                  handleSave();
                } 
              }} 
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost text-sm px-3 py-1.5" onClick={() => setOpen(false)}>Schließen</button>
              <button className="btn-primary text-sm px-3 py-1.5" onClick={handleSave}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MyIdInlineSetter({ onSet }: { onSet: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <input className="input flex-1" placeholder="Besitzer ID" value={v} onChange={(e)=>setV(e.target.value)} />
      <button className="btn-primary" onClick={()=> onSet(v)}>Speichern</button>
    </div>
  );
}
