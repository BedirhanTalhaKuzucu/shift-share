import React, { useEffect, useState } from 'react';
import { Draft, Shift } from '../types';
import { getMyId } from '../utils/storage';
import { FieldLabel } from './common';

interface ShiftFormProps {
  onSubmit: (d: Draft) => void;
  defaultOwnerId: string;
  editingShift?: Shift | null;
  isReassigning?: boolean;
}

export function ShiftForm({ onSubmit, defaultOwnerId, editingShift, isReassigning }: ShiftFormProps) {
  // Initialize with today's date and default times
  const getTodayDatetime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    return `${date}T00:00`;
  };

  const [form, setForm] = useState<Draft>(() => {
    if (editingShift) {
      return {
        startsAt: editingShift.startsAt,
        endsAt: editingShift.endsAt,
        notes: editingShift.notes || "",
        ownerId: isReassigning ? (editingShift.claimerContact || "") : editingShift.ownerId,
      };
    }
    return {
      startsAt: getTodayDatetime(),
      endsAt: getTodayDatetime(),
      notes: "",
      ownerId: defaultOwnerId || "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultOwnerId && !form.ownerId && !editingShift) {
      setForm((f) => ({ ...f, ownerId: defaultOwnerId }));
    }
  }, [defaultOwnerId, editingShift]);

  function update<K extends keyof Draft>(k: K, v: Draft[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!form.startsAt) newErrors.startsAt = "Startzeit ist erforderlich";
    if (!form.endsAt) newErrors.endsAt = "Endzeit ist erforderlich";
    if (!form.ownerId) newErrors.ownerId = "Besitzer ID ist erforderlich";

    // Check if end time is after start time
    if (form.startsAt && form.endsAt && form.endsAt <= form.startsAt) {
      newErrors.endsAt = "Endzeit muss nach der Startzeit liegen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSubmit(form);
    const today = getTodayDatetime();
    setForm({ startsAt: today, endsAt: today, notes: "", ownerId: form.ownerId });
    setErrors({});
  }

  // Extract date and time from datetime-local format
  const getDateFromDatetime = (dt: string) => dt.split('T')[0];
  const getTimeFromDatetime = (dt: string) => dt.split('T')[1] || '';
  
  const handleDateChange = (newDate: string) => {
    const startTime = getTimeFromDatetime(form.startsAt);
    const endTime = getTimeFromDatetime(form.endsAt);
    update("startsAt", startTime ? `${newDate}T${startTime}` : `${newDate}T00:00`);
    update("endsAt", endTime ? `${newDate}T${endTime}` : `${newDate}T00:00`);
  };

  const handleStartTimeChange = (newTime: string) => {
    const date = getDateFromDatetime(form.startsAt);
    update("startsAt", `${date}T${newTime}`);
    // Clear error when user changes the field
    if (errors.startsAt) {
      setErrors((prev) => ({ ...prev, startsAt: "" }));
    }
  };

  const handleEndTimeChange = (newTime: string) => {
    const date = getDateFromDatetime(form.endsAt);
    update("endsAt", `${date}T${newTime}`);
    // Clear error when user changes the field
    if (errors.endsAt) {
      setErrors((prev) => ({ ...prev, endsAt: "" }));
    }
  };


  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Date Picker */}
      <div className="space-y-2">
        <FieldLabel>Datum</FieldLabel>
        <input 
          type="date" 
          value={getDateFromDatetime(form.startsAt)} 
          onChange={(e) => handleDateChange(e.target.value)} 
          min={new Date().toISOString().split('T')[0]}
          className={`input ${errors.startsAt ? 'border-red-500' : ''}`}
          required 
        />
        {errors.startsAt && <p className="text-xs text-red-500">{errors.startsAt}</p>}
      </div>
      
      {/* Time Pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <FieldLabel>Startzeit</FieldLabel>
          <input 
            type="time" 
            value={getTimeFromDatetime(form.startsAt)} 
            onChange={(e) => handleStartTimeChange(e.target.value)} 
            className={`input text-sm ${errors.startsAt ? 'border-red-500' : ''}`}
            required 
          />
          {errors.startsAt && <p className="text-xs text-red-500">{errors.startsAt}</p>}
        </div>
        <div className="space-y-2">
          <FieldLabel>Endzeit</FieldLabel>
          <input 
            type="time" 
            value={getTimeFromDatetime(form.endsAt)} 
            onChange={(e) => handleEndTimeChange(e.target.value)} 
            className={`input text-sm ${errors.endsAt ? 'border-red-500' : ''}`}
            required 
          />
          {errors.endsAt && <p className="text-xs text-red-500">{errors.endsAt}</p>}
        </div>
      </div>
      
      {/* Notes */}
      <div className="space-y-2">
        <FieldLabel>Notizen (optional)</FieldLabel>
        <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input resize-none h-20" placeholder="Kurze Notizen" />
      </div>
      <div className="space-y-2">
        <FieldLabel>Besitzer ID</FieldLabel>
        <input type="text" value={form.ownerId} onChange={(e) => { update("ownerId", e.target.value); if (errors.ownerId) setErrors((prev) => ({ ...prev, ownerId: "" })); }} className={`input ${errors.ownerId ? 'border-red-500' : ''}`} placeholder="z.B. Mitarbeiter ID" required />
        {errors.ownerId && <p className="text-xs text-red-500">{errors.ownerId}</p>}
      </div>
      
      {!getMyId() && <p className="text-xs text-gray-500">Wird bei der ersten Eingabe auf diesem Gerät gespeichert.</p>}
      
      <button className="btn-primary w-full py-3 text-base font-semibold" type="submit">
        {editingShift ? (editingShift.status === "claimed" ? "Weitergeben" : "Änderungen Speichern") : "Anzeige Erstellen"}
      </button>
    </form>
  );
}
