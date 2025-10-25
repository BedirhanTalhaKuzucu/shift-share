import React, { useState, useEffect } from 'react';
import { Shift } from '../types';
import { fmt, formatDate, formatTime, calculateDuration } from '../utils/helpers';
import { FieldLabel } from './common';
import { Modal } from './Modal';

interface ShiftListProps {
  shifts: Shift[];
  myId: string | null;
  onClaim: (s: Shift, contact: string) => void;
  onCancel: (s: Shift) => void;
  onEdit?: (s: Shift) => void;
  onSetMyId?: (id: string) => void;
  onShowAlert?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

function ClaimButton({ shift, myId, onClaim, onSetMyId, onShowAlert }: { shift: Shift; myId: string | null; onClaim: (s: Shift, contact: string) => void; onSetMyId?: (id: string) => void; onShowAlert?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contact, setContact] = useState(myId ?? "");

  useEffect(() => {
    setContact(myId ?? "");
  }, [myId]);

  const handleClaim = () => {
    if (!contact.trim()) {
      onShowAlert?.("Bitte geben Sie eine ID ein", "warning");
      return;
    }
    if (onSetMyId && !myId) {
      onSetMyId(contact);
    }
    onClaim(shift, contact);
    setIsModalOpen(false);
  };

  return (
    <>
      <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>Übernehmen</button>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Schicht Übernehmen"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Geben Sie Ihre Mitarbeiter ID ein
          </p>
          <div className="space-y-2">
            <FieldLabel>Mitarbeiter ID</FieldLabel>
            <input
              type="text"
              placeholder="z.B. 12345"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleClaim();
              }}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setIsModalOpen(false)}>Abbrechen</button>
            <button className="btn-primary" onClick={handleClaim}>Übernehmen</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function ShiftList({ shifts, myId, onClaim, onCancel, onEdit, onSetMyId, onShowAlert }: ShiftListProps) {
  if (!shifts.length) return <p className="text-sm text-gray-500">Keine Einträge.</p>;

  return (
    <div className="space-y-3">
      {shifts
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .map((s) => (
          <div key={s.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                {s.status === "claimed" ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                    Übertragen
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Offen
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(s.startsAt)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatTime(s.startsAt)} - {formatTime(s.endsAt)} {calculateDuration(s.startsAt, s.endsAt)}
                </div>
                {s.ownerId && (
                  <div className="text-xs text-gray-500">
                    Ersteller: {s.ownerId}
                  </div>
                )}
              </div>
              
              {s.notes && (
                <div className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
                  {s.notes}
                </div>
              )}
              
              {s.status === "claimed" && myId && s.ownerId === myId && (
                <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
                  <strong>Übernommen von:</strong> {s.claimerContact}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {s.status === "open" && (!myId || s.ownerId !== myId) && (
                    <ClaimButton shift={s} myId={myId} onClaim={onClaim} onSetMyId={onSetMyId} onShowAlert={onShowAlert} />
                  )}
                </div>
                
                {myId && s.ownerId === myId && s.status === "open" && (
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button 
                        className="text-lg hover:opacity-70 transition-opacity" 
                        onClick={() => onEdit(s)}
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                    )}
                    <button className="btn-danger text-sm px-3 py-1.5" onClick={() => onCancel(s)}>
                      Löschen
                    </button>
                  </div>
                )}

                {myId && s.status === "claimed" && s.claimerContact === myId && (
                  <div className="flex items-center gap-2">
                    <button className="btn-primary text-sm px-3 py-1.5" onClick={() => onEdit?.(s)}>
                      Weitergeben
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
