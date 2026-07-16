import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import type { Ticket } from '../../types/api';

const ticketFormSchema = z.object({
  customer_name: z.string().trim().min(1, 'Customer name is required').max(100),
  customer_email: z.string().email('Invalid email').max(254),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  channel: z.string().optional(),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  initial?: Ticket | null;
  submitting: boolean;
  onSubmit: (values: TicketFormValues) => void;
  onClose: () => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-primary/5 border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-brand';

export const TicketForm = ({ initial, submitting, onSubmit, onClose }: TicketFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      customer_name: initial?.customer_name ?? '',
      customer_email: initial?.customer_email ?? '',
      subject: initial?.subject ?? '',
      description: initial?.description ?? '',
      channel: initial?.channel ?? 'Portal',
    },
  });

  useEffect(() => {
    register('channel');
  }, [register]);

  useEffect(() => {
    reset({
      customer_name: initial?.customer_name ?? '',
      customer_email: initial?.customer_email ?? '',
      subject: initial?.subject ?? '',
      description: initial?.description ?? '',
      channel: initial?.channel ?? 'Portal',
    });
  }, [initial, reset]);

  const channelValue = watch('channel') || 'Portal';

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
    >
      <div className="w-full max-w-md bg-background border border-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-primary text-base font-semibold">
            {initial ? 'Edit Ticket' : 'Create Ticket'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:bg-primary/5 hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
          <div>
            <label htmlFor="customer-name" className="block text-secondary text-xs mb-1.5">
              Customer Name
            </label>
            <input
              id="customer-name"
              {...register('customer_name')}
              className={inputClass}
              placeholder="e.g. John Doe"
            />
            {errors.customer_name ? (
              <p role="alert" className="text-xs text-red-400 mt-1">
                {errors.customer_name.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="customer-email" className="block text-secondary text-xs mb-1.5">
              Customer Email
            </label>
            <input
              id="customer-email"
              type="email"
              {...register('customer_email')}
              className={inputClass}
              placeholder="customer@example.com"
            />
            {errors.customer_email ? (
              <p role="alert" className="text-xs text-red-400 mt-1">
                {errors.customer_email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="ticket-channel" className="block text-secondary text-xs mb-1.5">
              Channel / Origin
            </label>
            <Select
              id="ticket-channel"
              value={channelValue}
              onChange={(val) => setValue('channel', val)}
              options={[
                { value: 'Portal', label: 'Portal' },
                { value: 'Social Media', label: 'Social Media' },
                { value: 'Email', label: 'Email' },
              ]}
              size="md"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="ticket-subject" className="block text-secondary text-xs mb-1.5">
              Subject
            </label>
            <input
              id="ticket-subject"
              {...register('subject')}
              className={inputClass}
              placeholder="Brief summary of the issue"
            />
            {errors.subject ? (
              <p role="alert" className="text-xs text-red-400 mt-1">
                {errors.subject.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="ticket-description" className="block text-secondary text-xs mb-1.5">
              Description
            </label>
            <textarea
              id="ticket-description"
              {...register('description')}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Provide a detailed description of the customer issue..."
            />
            {errors.description ? (
              <p role="alert" className="text-xs text-red-400 mt-1">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-secondary text-xs hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-accent-brand text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Creating…' : initial ? 'Save changes' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
