import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Mail, MessageSquare } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import type { Ticket, TicketStatus } from '../../types/api';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (id: string, data: { status?: TicketStatus; notes?: string }) => Promise<void>;
  updating: boolean;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const TicketDetail = ({ ticket, onClose, onUpdate, updating }: TicketDetailProps) => {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [newNote, setNewNote] = useState('');
  const [showAllNotes, setShowAllNotes] = useState(false);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating) return;

    await onUpdate(ticket.ticket_id, {
      status,
      ...(newNote.trim().length > 0 ? { notes: newNote.trim() } : {}),
    });

    setNewNote('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/[0.02]">
          <div>
            <span className="font-mono text-xs text-accent-brand font-bold bg-accent-brand/10 px-2 py-0.5 rounded">
              {ticket.ticket_id}
            </span>
            <h2
              id="ticket-detail-title"
              className="font-display text-primary text-base font-semibold mt-1 truncate max-w-[450px]"
            >
              {ticket.subject}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:bg-primary/5 hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary/[0.01] p-4 rounded-xl border border-border">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs">
                <User size={14} className="text-secondary shrink-0" />
                <span className="text-secondary font-medium shrink-0">Customer:</span>
                <span className="text-primary truncate font-semibold">{ticket.customer_name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Mail size={14} className="text-secondary shrink-0" />
                <span className="text-secondary font-medium shrink-0">Email:</span>
                <a
                  href={`mailto:${ticket.customer_email}`}
                  className="text-accent-brand hover:underline truncate"
                >
                  {ticket.customer_email}
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs">
                <Calendar size={14} className="text-secondary shrink-0" />
                <span className="text-secondary font-medium shrink-0">Created:</span>
                <span className="text-primary">{formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Clock size={14} className="text-secondary shrink-0" />
                <span className="text-secondary font-medium shrink-0">Updated:</span>
                <span className="text-primary">{formatDateTime(ticket.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-secondary">
              Description
            </h3>
            <div className="bg-primary/5 p-4 rounded-xl text-primary text-sm whitespace-pre-wrap leading-relaxed border border-border">
              {ticket.description}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-secondary flex items-center gap-1.5">
              <MessageSquare size={14} />
              Internal Comments ({ticket.notes?.length ?? 0})
            </h3>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {!ticket.notes || ticket.notes.length === 0 ? (
                <p className="text-secondary text-xs italic">No internal comments added yet.</p>
              ) : (
                <>
                  {(showAllNotes ? ticket.notes : ticket.notes.slice(0, 1)).map((note) => (
                    <div
                      key={note.id}
                      className="bg-surface border border-border p-3.5 rounded-xl space-y-1"
                    >
                      <p className="text-primary text-sm font-normal leading-relaxed">
                        {note.note_text}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-secondary justify-end">
                        <Clock size={10} />
                        <span>{formatDateTime(note.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {ticket.notes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllNotes(!showAllNotes)}
                      className="text-accent-brand text-xs font-semibold hover:underline focus:outline-none py-1 block"
                    >
                      {showAllNotes ? 'Show less' : `Show more (${ticket.notes.length - 1} more)`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="border-t border-border p-5 bg-primary/[0.02]">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="add-note"
                className="block text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              >
                Add Note / Internal Comment (Optional)
              </label>
              <textarea
                id="add-note"
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type an internal comment..."
                className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-brand resize-none"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:w-[240px] flex items-center gap-3">
                <label
                  htmlFor="update-status"
                  className="text-secondary text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  Status:
                </label>
                <Select
                  id="update-status"
                  value={status}
                  onChange={(v) => setStatus(v as TicketStatus)}
                  options={[
                    { value: 'Open', label: 'Open' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Closed', label: 'Closed' },
                  ]}
                  size="md"
                  className="w-full"
                  direction="up"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-accent-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
              >
                {updating ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
