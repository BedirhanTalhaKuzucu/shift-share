import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, SectionTitle, FieldLabel } from './components/common';
import { ShiftForm } from './components/ShiftForm';
import { ShiftList } from './components/ShiftList';
import { MyIdManager, MyIdInlineSetter } from './components/MyIdManager';
import { Modal } from './components/Modal';
import { AlertModal } from './components/AlertModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { FeedbackModal } from './components/FeedbackModal';
import { InfoModal } from './components/InfoModal';
import { Shift, Draft } from './types';
import { readAll, upsert, remove, getMyId, setMyId } from './utils/storage';
import { supabase } from './utils/supabase';
import './index.css';

export default function App() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tab, setTab] = useState<"feed" | "mine" | "claimed">("feed");
  const [myId, setMyIdState] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error'; title?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const shifts = await readAll();
      setShifts(shifts);
      setMyIdState(getMyId());
    };
    loadData();

    // Show info modal on first visit
    const hasSeenInfo = localStorage.getItem('hasSeenInfoModal');
    if (!hasSeenInfo) {
      setIsInfoModalOpen(true);
      localStorage.setItem('hasSeenInfoModal', 'true');
    }
  }, []);

  async function refresh() {
    setIsLoading(true);
    try {
      const shifts = await readAll();
      setShifts(shifts);
    } finally {
      setIsLoading(false);
    }
  }

  function showAlert(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', title?: string) {
    setAlert({ message, type, title });
  }

  async function handleFeedbackSubmit(feedback: { name: string; email: string; message: string }) {
    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            name: feedback.name,
            email: feedback.email,
            message: feedback.message,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        showAlert('Fehler beim Senden des Feedbacks', 'error');
        throw error;
      }
    } catch (err) {
      console.error('Feedback error:', err);
      throw err;
    }
  }

  function handleSetMyId(newId: string) {
    const v = newId.trim();
    if (!v) return showAlert("Geben Sie eine gültige ID ein.", "warning");
    setMyIdState(v);
    setMyId(v);
  }

  async function createShift(d: Draft) {
    setIsLoading(true);
    try {
      // Owner ID'yi ilk kez giriyorsa locale kaydedelim
      if (!getMyId()) {
        setMyId(d.ownerId);
        setMyIdState(d.ownerId);
      }

      if (editingShift) {
        // Check if this is a "weitergeben" (re-assign) operation
        if (editingShift.status === "claimed" && editingShift.claimerContact === myId) {
          // Re-assign: change status to "open", set new owner, clear claimer
          const updated: Shift = {
            ...editingShift,
            startsAt: d.startsAt,
            endsAt: d.endsAt,
            notes: d.notes?.trim() || undefined,
            ownerId: d.ownerId.trim(),
            status: "open",
            claimerContact: undefined,
          };
          await upsert(updated);
          await refresh();
          setIsModalOpen(false);
          setEditingShift(null);
          showAlert("Die Schicht wurde erneut zur Abgabe eingestellt! Sie finden sie unter 'Meine Anzeigen'.", "success");
        } else {
          // Regular update
          const updated: Shift = {
            ...editingShift,
            startsAt: d.startsAt,
            endsAt: d.endsAt,
            notes: d.notes?.trim() || undefined,
            ownerId: d.ownerId.trim(),
          };
          await upsert(updated);
          await refresh();
          setIsModalOpen(false);
          setEditingShift(null);
          showAlert("Schicht wurde aktualisiert.", "success");
        }
      } else {
        // Create new shift
        const shift: Shift = {
          id: uuidv4(),
          createdAt: Date.now(),
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          notes: d.notes?.trim() || undefined,
          ownerId: d.ownerId.trim(),
          status: "open",
        };
        await upsert(shift);
        await refresh();
        setIsModalOpen(false);
        showAlert("Schicht erstellt und zum Feed hinzugefügt. Unter 'Meine Anzeigen' sichtbar.", "success");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function claimShift(shift: Shift, contact: string) {
    setIsLoading(true);
    try {
      // Check current status in database before claiming
      const { data, error } = await supabase
        .from('shifts')
        .select('status, claimer_contact')
        .eq('id', shift.id)
        .single();
      
      if (error || !data) {
        return showAlert("Fehler beim Abrufen der Schicht. Bitte versuchen Sie es später erneut.", "error");
      }
      
      if (data.status === "claimed") {
        // Update local state to reflect that someone else claimed it
        await refresh();
        return showAlert(`Diese Schicht wurde bereits von ${data.claimer_contact} übernommen.`, "warning");
      }
      
      if (data.status !== "open") {
        // Update local state to reflect status change
        await refresh();
        return showAlert("Diese Schicht ist nicht mehr verfügbar.", "warning");
      }
      
      const updated: Shift = { ...shift, status: "claimed", claimerContact: contact };
      await upsert(updated);
      await refresh();
      showAlert("Schicht erfolgreich übernommen! Unter 'Übernommen' können Sie sie einsehen.", "success");
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelShift(shift: Shift) {
    if (!myId || shift.ownerId !== myId) return showAlert("Sie haben keine Berechtigung, diese Anzeige zu löschen.", "error");
    if (!window.confirm("Sind Sie sicher, dass Sie diese Schicht löschen möchten?")) return;
    setIsLoading(true);
    try {
      await remove(shift.id);
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }

  function handleEditShift(shift: Shift) {
    setEditingShift(shift);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingShift(null);
  }

  const openShifts = useMemo(() => myId ? shifts.filter((s) => s.status === "open" && s.ownerId !== myId) : shifts.filter((s) => s.status === "open"), [shifts, myId]);
  const myShifts = useMemo(() => myId ? shifts.filter((s) => s.ownerId === myId) : [], [shifts, myId]);
  const claimedShifts = useMemo(() => myId ? shifts.filter((s) => s.status === "claimed" && s.claimerContact === myId) : [], [shifts, myId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur z-20 border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕐</span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Schicht Übertragung</h1>
              <p className="text-xs text-gray-500">MVP</p>
            </div>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="text-lg hover:opacity-70 transition-opacity ml-2"
              title="Informationen"
            >
              ℹ️
            </button>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="text-lg hover:opacity-70 transition-opacity"
              title="Feedback geben"
            >
              💬
            </button>
          </div>
          <div className="flex items-center gap-3">
            <MyIdManager myId={myId} onSet={handleSetMyId} />
            {/* Floating Add Button - Desktop */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 px-4 py-2 rounded-xl transition-colors backdrop-blur"
            >
              <span className="text-lg">➕</span>
              <span className="text-sm font-medium">Schicht Übertragen</span>
            </button>
          </div>
        </div>
        
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {tab === "feed" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Offene Schichten" subtitle="Klicken und ID eingeben, sofort übernehmen." />
              <button 
                onClick={() => refresh()}
                className="text-2xl hover:opacity-70 transition-opacity" 
                title="Aktualisieren"
              >
                🔄
              </button>
            </div>
            <ShiftList
              shifts={openShifts}
              myId={myId}
              onClaim={claimShift}
              onCancel={cancelShift}
              onEdit={handleEditShift}
              onSetMyId={handleSetMyId}
              onShowAlert={showAlert}
            />
          </div>
        )}

        {tab === "mine" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Meine Anzeigen" subtitle={myId ? `Besitzer ID: ${myId}` : "ID eingeben um Anzeigen zu sehen"} />
              <button 
                onClick={() => refresh()}
                className="text-2xl hover:opacity-70 transition-opacity" 
                title="Aktualisieren"
              >
                🔄
              </button>
            </div>
            {!myId ? (
              <div className="space-y-3">
                <FieldLabel>Geben Sie zuerst Ihre ID ein</FieldLabel>
                <MyIdInlineSetter onSet={handleSetMyId} />
                <p className="text-xs text-gray-500">ID wird einmal eingegeben und auf diesem Gerät gespeichert.</p>
              </div>
            ) : (
              <ShiftList
                shifts={myShifts}
                myId={myId}
                onClaim={claimShift}
                onCancel={cancelShift}
                onEdit={handleEditShift}
                onSetMyId={handleSetMyId}
                onShowAlert={showAlert}
              />
            )}
          </div>
        )}

        {tab === "claimed" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Übernommene" subtitle={myId ? `Von mir übernommene und akzeptierte Schichten` : "ID eingeben um übernommene zu sehen"} />
              <button 
                onClick={() => refresh()}
                className="text-2xl hover:opacity-70 transition-opacity" 
                title="Aktualisieren"
              >
                🔄
              </button>
            </div>
            {!myId ? (
              <div className="space-y-3">
                <FieldLabel>Geben Sie zuerst Ihre ID ein</FieldLabel>
                <MyIdInlineSetter onSet={handleSetMyId} />
                <p className="text-xs text-gray-500">ID wird einmal eingegeben und auf diesem Gerät gespeichert.</p>
              </div>
            ) : (
              <ShiftList
                shifts={claimedShifts}
                myId={myId}
                onClaim={claimShift}
                onCancel={cancelShift}
                onEdit={handleEditShift}
                onSetMyId={handleSetMyId}
                onShowAlert={showAlert}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-10">
        <div className="max-w-2xl mx-auto flex justify-center relative">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <button 
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-8 rounded-lg transition-colors ${
                tab === "feed" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setTab("feed")}
            >
              <span className="text-xl md:text-base">📋</span>
              <span className="text-xs md:text-sm font-medium">Feed</span>
            </button>
            
            <div className="w-px h-8 bg-gray-300" />
            
            <button 
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-8 rounded-lg transition-colors ${
                tab === "mine" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setTab("mine")}
            >
              <span className="text-xl md:text-base">👤</span>
              <span className="text-xs md:text-sm font-medium">Meine Anzeigen</span>
            </button>

            <div className="w-px h-8 bg-gray-300" />

            <button 
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-8 rounded-lg transition-colors ${
                tab === "claimed" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setTab("claimed")}
            >
              <span className="text-xl md:text-base">✅</span>
              <span className="text-xs md:text-sm font-medium">Übernommene</span>
            </button>
          </div>
          
          {/* Mobile Floating Add Button - Positioned relative to nav */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden absolute -top-12 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-colors z-20 flex flex-col items-center py-2 px-3"
          >
            <span className="text-lg mb-1">➕</span>
            <span className="text-xs font-medium">Übertragen</span>
          </button>
        </div>
      </nav>


      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingShift ? (editingShift.status === "claimed" && editingShift.claimerContact === myId ? "Schicht Weitergeben" : "Schicht Bearbeiten") : "Schicht Übertragen"}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {editingShift ? (editingShift.status === "claimed" && editingShift.claimerContact === myId ? "Geben Sie die Schicht an jemand anderen weiter." : "Nehmen Sie Änderungen vor und speichern Sie.") : "Formular ausfüllen → erscheint im Feed. Ihre ID wird automatisch gespeichert."}
          </p>
          <ShiftForm 
            onSubmit={createShift} 
            defaultOwnerId={myId ?? ""} 
            editingShift={editingShift}
            isReassigning={editingShift?.status === "claimed" && editingShift?.claimerContact === myId}
          />
        </div>
      </Modal>

      {/* Info Modal */}
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* Alert Modal */}
      <AlertModal 
        isOpen={!!alert} 
        onClose={() => setAlert(null)}
        message={alert?.message || ""}
        type={alert?.type || "info"}
        title={alert?.title}
      />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
