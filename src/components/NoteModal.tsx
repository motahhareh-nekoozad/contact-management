import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Message } from '../types';

interface NoteModalProps {
  message: Message | null;
  onClose: () => void;
  onSave: (variables: { id: string | number; internal_notes: string }) => void;
}

export const NoteModal = ({ message, onClose, onSave }: NoteModalProps) => {
  const [noteText, setNoteText] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) {
      setNoteText(message.internal_notes || '');
      
      // Smooth open animation with GSAP elastic/spring-back effect
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(modalRef.current, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' });
    }
  }, [message]);

  const handleClose = () => {
    // Close animation synchronized with overlay fade-out
    gsap.to(modalRef.current, { scale: 0.92, opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: onClose });
  };

const handleSave = () => {
    if (message) {
      onSave({ id: message.id, internal_notes: noteText });
      handleClose();
    }
  };

  if (!message) return null;

  return (
    <div
      ref={overlayRef}
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
            Note for <span className="text-brand-500">{message.name}</span>
          </h3>
          <button 
            onClick={handleClose} 
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-3 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-150/60 dark:border-zinc-850 leading-relaxed italic">
          "{message.description}"
        </p>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Type your internal note here..."
          rows={4}
          className="w-full p-3.5 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all mb-4 text-xs resize-none leading-relaxed"
        />

        <div className="flex justify-end gap-2.5">
          <button
            onClick={handleClose}
            className="px-4.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 transition-all"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};