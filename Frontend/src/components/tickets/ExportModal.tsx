import { X, FileText, Table } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onClose: () => void;
  onExport: (format: 'csv' | 'xlsx') => void;
}

export const ExportModal = ({ onClose, onExport }: Props) => {
  const [selected, setSelected] = useState<'csv' | 'xlsx'>('csv');

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm bg-background border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-primary text-base font-semibold">Export Tickets</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-secondary text-xs">
            Choose the format to download your filtered tickets list.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelected('csv')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all ${
                selected === 'csv'
                  ? 'border-accent-brand bg-accent-brand/5 text-accent-brand'
                  : 'border-border bg-surface text-secondary hover:text-primary hover:border-primary/20'
              }`}
            >
              <FileText size={24} />
              <div className="flex flex-col">
                <span className="text-xs font-semibold font-display">CSV</span>
                <span className="text-[10px] opacity-70">Comma Separated</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelected('xlsx')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all ${
                selected === 'xlsx'
                  ? 'border-accent-brand bg-accent-brand/5 text-accent-brand'
                  : 'border-border bg-surface text-secondary hover:text-primary hover:border-primary/20'
              }`}
            >
              <Table size={24} />
              <div className="flex flex-col">
                <span className="text-xs font-semibold font-display">Excel (XLSX)</span>
                <span className="text-[10px] opacity-70">Spreadsheet</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-primary/[0.01] rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-secondary text-xs hover:bg-primary/5 hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onExport(selected);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-accent-brand text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Export File
          </button>
        </div>
      </div>
    </div>
  );
};
