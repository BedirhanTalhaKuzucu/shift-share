import React, { useState } from 'react';
import { Modal } from './Modal';
import { FieldLabel } from './common';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { name: string; email: string; message: string }) => Promise<void>;
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.message.trim()) {
      alert('Bitte füllen Sie Email und Nachricht aus');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setSubmitted(true);
      setTimeout(() => {
        setForm({ name: '', email: '', message: '' });
        setSubmitted(false);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback">
      {submitted ? (
        <div className="text-center space-y-3">
          <p className="text-2xl">✅</p>
          <p className="text-green-700 font-medium">Danke für dein Feedback!</p>
          <p className="text-sm text-gray-600">Deine Nachricht wurde erfolgreich gesendet.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel>Name (optional)</FieldLabel>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Dein Name (optional)"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Email *</FieldLabel>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="deine@email.com"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Nachricht *</FieldLabel>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="input resize-none h-24"
              placeholder="Schreib dein Feedback, Feature-Wunsch oder Fehler-Report..."
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird gesendet...' : 'Senden'}
          </button>
        </form>
      )}
    </Modal>
  );
}
