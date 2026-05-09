import Modal from './Modal';
import { Info } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonLabel?: string;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonLabel = 'OK',
}: AlertModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Info className="w-8 h-8" />
        </div>
        
        <p className="text-slate-600 text-base leading-relaxed px-2">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all duration-200 shadow-xl shadow-slate-200"
        >
          {buttonLabel}
        </button>
      </div>
    </Modal>
  );
}
