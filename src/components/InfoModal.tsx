import React, { useState } from 'react';
import { Modal } from './Modal';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
    const [page, setPage] = useState(1);

    const handleNext = () => {
        setPage(2);
    };

    const handleBack = () => {
        setPage(1);
    };

    const handleClose = () => {
        setPage(1);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Informationen">
            {page === 1 ? (
                // Page 1: Introduction
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>👋 Willkommen bei Schicht Übertragung!</strong>
                        </p>
                        <p className="text-sm text-blue-900 mt-3">
                            Diese Anwendung ist eine <strong>einfache Plattform</strong> zum Austausch von Arbeitschichten.
                        </p>
                        <p className="text-sm text-blue-900 mt-3">
                            <strong>Was kannst du hier tun?</strong>
                        </p>
                        <ul className="text-sm text-blue-900 mt-2 space-y-2 ml-4">
                            <li>✅ <strong>Verfügbare Schichten ansehen</strong> – Alle angebotenen Schichten im Feed anzeigen</li>
                            <li>✅ <strong>Schichten übernehmen</strong> – Schichten von anderen Kolleginnen und Kollegen übernehmen</li>
                            <li>✅ <strong>Schichten anbieten</strong> – Deine eigene Schicht als Angebot für einen Tausch erstellen</li>
                            <li>✅ <strong>Automatische Bereinigung</strong> – Schichten, die älter als 3&nbsp;Stunden sind, werden automatisch gelöscht, damit du nur aktuelle Schichten siehst</li>
                        </ul>
                        <p className="text-sm text-blue-900 mt-4">
                            Die Anwendung ist <strong>kostenlos</strong> und benötigt <strong>keine Anmeldung</strong>.
                        </p>
                    </div>

                    <button
                        onClick={handleNext}
                        className="btn-primary w-full py-3"
                    >
                        Weiter →
                    </button>
                </div>
            ) : (
                // Page 2: Disclaimer
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>⚠️ Wichtiger Hinweis:</strong>
                        </p>
                        <p className="text-sm text-yellow-800 mt-3">
                            Diese Anwendung verfügt <strong>über kein Login- oder Authentifizierungssystem</strong>.
                            Benutzer können sich daher mit unterschiedlichen IDs anmelden und die Plattform potenziell missbrauchen.
                        </p>
                        <p className="text-sm text-yellow-800 mt-3">
                            <strong>Haftungsausschluss:</strong> Der Betreiber übernimmt <strong>keine Verantwortung</strong> für die Nutzung dieser Plattform.
                            Schichttausch sollten weiterhin über <strong>offizielle Systeme</strong> durchgeführt werden.
                        </p>
                        <p className="text-sm text-yellow-800 mt-3">
                            Diese Plattform dient nur zu <strong>Informationszwecken</strong> und ersetzt keine offiziellen Prozesse.
                        </p>
                        <p className="text-sm text-yellow-800 mt-3">
                            🧪 Die Anwendung befindet sich noch in der <strong>Demo-Phase</strong> und kann Fehler enthalten.
                            Bitte melden Sie Probleme über den <strong>Feedback-Bereich 💬</strong>.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleBack}
                            className="btn-secondary w-full py-3"
                        >
                            ← Zurück
                        </button>
                        <button
                            onClick={handleClose}
                            className="btn-primary w-full py-3"
                        >
                            Verstanden
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
