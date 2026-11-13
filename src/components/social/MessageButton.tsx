'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startThread } from '@/services/inbox';
import { useSession } from '../providers/AppProviders';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/Field';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';

/**
 * OV-09 message composer (S-07, BR-82): "Message" on profiles, shots, designer cards and services. Visitors get
 * the auth gate (`message-user`). Sending creates or reuses a thread and offers to open it.
 */
export function MessageButton({
  username,
  displayName,
  label = 'Message',
  context,
  prefill = '',
  variant = 'secondary',
  block = false,
}: {
  username: string;
  displayName: string;
  label?: string;
  context?: { type: 'shot' | 'service' | 'profile'; id: number; label: string; href: string };
  prefill?: string;
  variant?: 'secondary' | 'primary';
  block?: boolean;
}) {
  const { viewer, requireMember } = useSession();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(prefill);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  if (viewer.kind === 'member' && viewer.username === username) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 1) return setError('Write a message first.');
    if (body.length > 5000) return setError('Messages are at most 5,000 characters.');
    setBusy(true);
    const r = await startThread({ toUsername: username, body, context: context ? { type: context.type, id: context.id } : undefined }, context ? { label: context.label, href: context.href } : undefined);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setOpen(false);
    setBody(prefill);
    toast({ tone: 'success', text: `Message sent to ${displayName}.`, action: { label: 'View', run: () => router.push(`/messages/${r.data.threadId}`) } });
  };

  return (
    <>
      <button
        type="button"
        className={`ui-btn ${variant === 'primary' ? 'ui-btn--primary' : 'ui-btn--secondary neu-control'} ${block ? 'ui-btn--block' : ''}`}
        onClick={() => requireMember('message-user', `message ${displayName}`, username) && setOpen(true)}
      >
        <Icon name="message" />
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Message ${displayName}`} description={context ? `About: ${context.label}` : undefined}>
        <form className="stack" onSubmit={send} noValidate>
          <TextArea label="Your message" value={body} maxLength={5000} onChange={(e) => (setBody(e.target.value), setError(null))} error={error} rows={6} data-autofocus placeholder={`Hi ${displayName.split(' ')[0]}, …`} />
          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
              <Icon name="send" /> Send
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
