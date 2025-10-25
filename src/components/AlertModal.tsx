import React from 'react';
import { Modal } from './Modal';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success': return 'Erfolgreich';
      case 'warning': return 'Warnung';
      case 'error': return 'Fehler';
      default: return 'Information';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-4">
        <div className={`rounded-lg p-4 border ${getColorClasses()}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">{getIcon()}</span>
            <p className="text-sm">{message}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="btn-primary w-full"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
