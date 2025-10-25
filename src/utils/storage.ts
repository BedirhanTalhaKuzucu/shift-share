import { Shift } from '../types';
import { supabase } from './supabase';

// Storage Keys (for fallback)
export const STORAGE_KEY = "shift_swap_mvp_v2";
export const MY_ID_KEY = "shift_swap_my_id";

// Storage Layer with Supabase
export async function readAll(): Promise<Shift[]> {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*');
    
    if (error) {
      console.error('Supabase error:', error);
      return getFallbackShifts();
    }
    
    return (data || []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      notes: row.notes,
      ownerId: row.owner_id,
      status: row.status,
      claimerContact: row.claimer_contact,
    }));
  } catch (err) {
    console.error('Error reading shifts:', err);
    return getFallbackShifts();
  }
}

function getFallbackShifts(): Shift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Shift[]) : [];
  } catch {
    return [];
  }
}

export async function upsert(shift: Shift): Promise<void> {
  try {
    const { error } = await supabase
      .from('shifts')
      .upsert({
        id: shift.id,
        created_at: shift.createdAt,
        starts_at: shift.startsAt,
        ends_at: shift.endsAt,
        notes: shift.notes,
        owner_id: shift.ownerId,
        status: shift.status,
        claimer_contact: shift.claimerContact,
      }, { onConflict: 'id' });
    
    if (error) {
      console.error('Supabase upsert error:', error);
      // Fallback to localStorage
      const all = getFallbackShifts();
      const i = all.findIndex((s) => s.id === shift.id);
      if (i >= 0) all[i] = shift; else all.push(shift);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Error upserting shift:', err);
  }
}

export async function remove(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase delete error:', error);
      // Fallback to localStorage
      const all = getFallbackShifts().filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Error removing shift:', err);
  }
}

export function getMyId(): string | null {
  try { return localStorage.getItem(MY_ID_KEY); } catch { return null; }
}

export function setMyId(v: string) {
  localStorage.setItem(MY_ID_KEY, v);
}
