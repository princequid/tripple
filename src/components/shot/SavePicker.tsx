'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createCollection, saveTargets, setSaved } from '@/services/social';
import type { SaveTarget } from '@/services/contracts';
import { useSession } from '../providers/AppProviders';
import { Modal } from '../ui/Modal';
import { Checkbox, TextField } from '../ui/Field';
import { ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';

/**
 * OV-05 save-to-collection picker (S-02, FR-47, BR-53…55). Each checkbox is a set operation (PUT/DELETE) applied
 * immediately with rollback. "New collection" creates one and saves the shot into it.
 */
export function SavePicker({ shotId, title, open, onClose, onSavedChange }: { shotId: number; title: string; open: boolean; onClose: () => void; onSavedChange?: (anySaved: boolean) => void }) {
  const [items, setItems] = useState<SaveTarget[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [priv, setPriv] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = async () => {
    setFailed(false);
    setItems(null);
    const r = await saveTargets(shotId);
    if (r.ok) setItems(r.data);
    else setFailed(true);
  };
  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shotId]);
  useEffect(() => {
    if (items) onSavedChange?.(items.some((i) => i.contains));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const toggle = async (c: SaveTarget, on: boolean) => {
    setItems((xs) => xs?.map((x) => (x.id === c.id ? { ...x, contains: on, shotsCount: x.shotsCount + (on ? 1 : -1) } : x)) ?? null);
    const r = await setSaved(c.id, shotId, on);
    if (!r.ok) {
      setItems((xs) => xs?.map((x) => (x.id === c.id ? c : x)) ?? null);
      toast({ tone: 'error', text: r.message || 'Couldn’t update the collection.' });
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length > 60) return setNameError('Use 1–60 characters.');
    setBusy(true);
    const r = await createCollection({ name: name.trim(), isPrivate: priv }, shotId);
    setBusy(false);
    if (!r.ok) return setNameError(r.fields?.name ?? r.message);
    setItems((xs) => [{ id: r.data.id, name: r.data.name, isPrivate: r.data.isPrivate, contains: true, shotsCount: 1 }, ...(xs ?? [])]);
    setCreating(false);
    setName('');
    setPriv(false);
    toast({ tone: 'success', text: `Saved to ${r.data.name}.` });
  };

  return (
    <Modal open={open} onClose={onClose} title="Save to collection" description={title} size="sm">
      {failed ? (
        <ErrorState onRetry={load} />
      ) : items === null ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
          {items.length === 0 && !creating && <p className="t-body-sm">You don’t have any collections yet. Create one to start saving shots.</p>}
          <div className="save-list" role="group" aria-label="Your collections">
            {items.map((c) => (
              <Checkbox
                key={c.id}
                checked={c.contains}
                onChange={(v) => toggle(c, v)}
                label={
                  <span className="cluster" style={{ ['--cluster-gap' as string]: 'var(--space-2)' }}>
                    {c.name}
                    {c.isPrivate && <Icon name="lock" size={14} label="Private" />}
                  </span>
                }
                hint={`${c.shotsCount} shot${c.shotsCount === 1 ? '' : 's'}`}
              />
            ))}
          </div>
          {creating ? (
            <form className="stack save-new" onSubmit={create} noValidate>
              <TextField label="Collection name" value={name} maxLength={60} onChange={(e) => (setName(e.target.value), setNameError(null))} error={nameError} data-autofocus />
              <Checkbox label="Keep this collection private" checked={priv} onChange={setPriv} hint="Only you can see private collections." />
              <div className="form-actions">
                <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
                  Create and save
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="ui-btn ui-btn--on-glass ui-btn--block" onClick={() => setCreating(true)}>
              <Icon name="plus" /> New collection
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Save trigger (icon on cards, labelled on detail). Visitors get the auth gate (`save-shot`). */
export function SaveButton({ shotId, title, variant = 'icon' }: { shotId: number; title: string; variant?: 'icon' | 'card' }) {
  const { requireMember, viewer } = useSession();
  const [open, setOpen] = useState(false);
  const [saved, setSavedState] = useState(false);
  return (
    <>
      <button
        type="button"
        className={variant === 'card' ? 'ui-icon-btn ui-icon-btn--sm' : 'ui-icon-btn neu-control'}
        aria-label={`Save ${title}`}
        aria-pressed={saved}
        onClick={() => requireMember('save-shot', 'save shots', shotId) && setOpen(true)}
        data-testid="save-button"
      >
        <Icon name="bookmark" />
      </button>
      {viewer.kind === 'member' && <SavePicker shotId={shotId} title={title} open={open} onClose={() => setOpen(false)} onSavedChange={setSavedState} />}
    </>
  );
}

export const LinkToCollections = ({ username }: { username: string }) => (
  <Link className="text-link" href={`/${username}/collections`}>
    Your collections
  </Link>
);
