'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDraft, getDraft, saveDraft, uploadImage, UPLOAD_RULES, validateDraft } from '@/services/composer';
import { myTeams } from '@/services/account';
import type { ComposerBlock, ShotDraftInput, TeamMembership } from '@/services/contracts';
import { CATEGORIES } from '@/lib/catalog';
import { tagSlug } from '@/lib/slug';
import { useSession } from '../providers/AppProviders';
import { ChipInput, SelectField, Switch, TextArea, TextField } from '../ui/Field';
import { ConfirmDialog } from '../ui/Modal';
import { ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';
import { PreviewNote } from '../ui/PreviewNote';

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * SCR-20 / SCR-21 shot composer (C-01, C-04, C-05, BR-61…66): drop or pick images (JPEG/PNG/WebP, ≤ 20 MB,
 * ≥ 400×300), per-file progress and errors, text blocks, reorder (buttons, keyboard-accessible), alt text,
 * title, description, category, tags (≤ 20), team attribution, comments toggle; Save draft / Publish; Delete.
 */
export function Composer({ draftId }: { draftId: number | null }) {
  const { viewer } = useSession();
  const [blocks, setBlocks] = useState<ComposerBlock[]>([]);
  const [meta, setMeta] = useState({ title: '', description: '', categorySlug: '', tags: [] as string[], teamUsername: '' as string, commentsDisabled: false });
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>(draftId ? 'loading' : 'ready');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);
  const [drag, setDrag] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    void myTeams().then((r) => r.ok && setTeams(r.data.teams));
    if (!draftId) return;
    void getDraft(draftId).then((r) => {
      if (!r.ok) return setState('missing');
      const d = r.data;
      setMeta({ title: d.title, description: d.description, categorySlug: d.categorySlug, tags: d.tags, teamUsername: d.teamUsername ?? '', commentsDisabled: d.commentsDisabled });
      setBlocks(d.previewBlocks);
      setStatus(d.status);
      setState('ready');
    });
  }, [draftId]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (state === 'missing') return <ErrorState title="This draft isn’t available" body="Drafts are kept for your account only. It may have been deleted." />;
  if (state === 'loading') return <ListSkeleton rows={5} />;

  const touch = () => setDirty(true);
  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = UPLOAD_RULES.maxBlocks - blocks.length;
    if (room <= 0) return toast({ tone: 'error', text: 'A shot has at most 20 blocks.' });
    if (list.length > room) toast({ tone: 'info', text: `Only the first ${room} file${room === 1 ? '' : 's'} were added (20 blocks max).` });
    touch();
    for (const file of list.slice(0, room)) {
      const clientId = uid();
      setBlocks((b) => [...b, { kind: 'image', clientId, media: null, alt: '', isFullWidth: false, progress: 0, error: null, fileName: file.name }]);
      const r = await uploadImage(file, (p) => setBlocks((b) => b.map((x) => (x.clientId === clientId && x.kind === 'image' ? { ...x, progress: p } : x))));
      setBlocks((b) => b.map((x) => (x.clientId === clientId && x.kind === 'image' ? (r.ok ? { ...x, media: r.data, progress: 100 } : { ...x, error: r.message }) : x)));
      setErrors((e) => ({ ...e, blocks: '' }));
    }
  };
  const move = (i: number, d: -1 | 1) => {
    touch();
    setBlocks((b) => {
      const n = [...b];
      const j = i + d;
      if (j < 0 || j >= n.length) return b;
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });
  };
  const update = (clientId: string, patch: Partial<ComposerBlock>) => {
    touch();
    setBlocks((b) => b.map((x) => (x.clientId === clientId ? ({ ...x, ...patch } as ComposerBlock) : x)));
  };
  const input = (): ShotDraftInput => ({
    title: meta.title.trim(),
    description: meta.description,
    categorySlug: meta.categorySlug,
    tags: meta.tags,
    teamUsername: meta.teamUsername || null,
    commentsDisabled: meta.commentsDisabled,
    blocks: blocks.flatMap<ShotDraftInput['blocks'][number]>((b) => (b.kind === 'text' ? (b.text.trim() ? [{ type: 'text' as const, text: b.text.trim() }] : []) : b.media ? [{ type: 'image' as const, mediaId: b.media.mediaId, alt: b.alt, isFullWidth: b.isFullWidth }] : [])),
  });
  const submit = async (publish: boolean) => {
    if (blocks.some((b) => b.kind === 'image' && !b.media && !b.error)) return toast({ tone: 'info', text: 'Wait for uploads to finish.' });
    const i = input();
    const err = validateDraft(i, publish);
    setErrors(err);
    if (Object.keys(err).length) return setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .composer-drop[data-invalid]')?.focus(), 0);
    setBusy(publish ? 'publish' : 'draft');
    const r = await saveDraft(draftId, i, blocks, publish);
    setBusy(null);
    if (!r.ok) return setErrors(r.fields ?? { form: r.message });
    setDirty(false);
    toast({ tone: 'success', text: publish ? 'Shot published.' : 'Draft saved.' });
    if (publish && r.data.canonicalPath) return router.push(r.data.canonicalPath);
    if (viewer.kind === 'member') router.push(publish || draftId ? `/${viewer.username}` : `/shots/${r.data.id}/edit`);
  };

  const images = blocks.filter((b) => b.kind === 'image').length;
  return (
    <div className="composer">
      <div className="composer__main stack">
        <PreviewNote feature="composer" />
        {errors.form && (
          <div className="ui-alert ui-alert--error" role="alert">
            <Icon name="alert" />
            {errors.form}
          </div>
        )}
        <TextField label="Title" value={meta.title} maxLength={100} onChange={(e) => (setMeta({ ...meta, title: e.target.value }), touch())} error={errors.title} placeholder="Give your shot a name" className="composer__title" />
        <div
          className={`composer-drop${drag ? ' is-drag' : ''}`}
          data-invalid={errors.blocks ? '' : undefined}
          tabIndex={-1}
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void addFiles(e.dataTransfer.files);
          }}
        >
          <Icon name="image" className="composer-drop__icon" strokeWidth={1.5} />
          <p className="t-body">
            <strong>Drag and drop images</strong>, or{' '}
            <button type="button" className="link-button text-link" onClick={() => fileInput.current?.click()}>
              browse
            </button>
          </p>
          <p className="t-caption text-secondary">JPEG, PNG or WebP · up to 20 MB · at least 400 × 300 px · {UPLOAD_RULES.maxBlocks - blocks.length} blocks left</p>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => (e.target.files && void addFiles(e.target.files), (e.target.value = ''))} />
        </div>
        {errors.blocks && (
          <p className="ui-field__error" role="alert">
            {errors.blocks}
          </p>
        )}
        <ol className="composer-blocks" aria-label="Content blocks">
          {blocks.map((b, i) => (
            <li key={b.clientId} className="composer-block">
              <div className="composer-block__tools" role="group" aria-label={`Block ${i + 1} of ${blocks.length}`}>
                <span className="t-caption text-secondary">
                  {i + 1}. {b.kind === 'image' ? 'Image' : 'Text'}
                </span>
                <button type="button" className="ui-icon-btn ui-icon-btn--sm ui-btn--ghost" aria-label={`Move block ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <Icon name="arrowUp" />
                </button>
                <button type="button" className="ui-icon-btn ui-icon-btn--sm ui-btn--ghost" aria-label={`Move block ${i + 1} down`} disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
                  <Icon name="arrowDown" />
                </button>
                <button type="button" className="ui-icon-btn ui-icon-btn--sm ui-btn--ghost" aria-label={`Remove block ${i + 1}`} onClick={() => (touch(), setBlocks((x) => x.filter((y) => y.clientId !== b.clientId)))}>
                  <Icon name="trash" />
                </button>
              </div>
              {b.kind === 'image' ? (
                <div className="composer-image">
                  <div className="composer-image__media" style={{ ['--shot-placeholder' as string]: b.media?.dominantColor ?? undefined }}>
                    {b.media?.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                      <img src={b.media.previewUrl} alt="" />
                    ) : b.error ? (
                      <div className="composer-image__error" role="alert">
                        <Icon name="alert" />
                        <span>{b.error}</span>
                      </div>
                    ) : b.media ? (
                      <div className="composer-image__error">
                        <Icon name="image" />
                        <span>{b.fileName} (re-select to preview)</span>
                      </div>
                    ) : (
                      <div className="composer-progress" role="progressbar" aria-valuenow={b.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${b.fileName}`}>
                        <span style={{ width: `${b.progress}%` }} />
                      </div>
                    )}
                  </div>
                  {b.media && (
                    <div className="composer-image__fields">
                      <TextField label="Alt text" optional value={b.alt} maxLength={250} onChange={(e) => update(b.clientId, { alt: e.target.value })} hint="Describe the image for people using screen readers." />
                      <Switch label="Show full width" checked={b.isFullWidth} onChange={(v) => update(b.clientId, { isFullWidth: v })} />
                    </div>
                  )}
                </div>
              ) : (
                <TextArea label="Text" value={b.text} maxLength={2000} rows={3} onChange={(e) => update(b.clientId, { text: e.target.value })} />
              )}
            </li>
          ))}
        </ol>
        <div className="cluster">
          <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={() => fileInput.current?.click()} disabled={blocks.length >= UPLOAD_RULES.maxBlocks}>
            <Icon name="image" /> Add images
          </button>
          <button type="button" className="ui-btn ui-btn--secondary neu-control" disabled={blocks.length >= UPLOAD_RULES.maxBlocks} onClick={() => (touch(), setBlocks((b) => [...b, { kind: 'text', clientId: uid(), text: '' }]))}>
            <Icon name="text" /> Add text
          </button>
        </div>
      </div>

      <aside className="composer__side ui-card stack" aria-label="Shot settings">
        <SelectField label="Category" value={meta.categorySlug} onChange={(e) => (setMeta({ ...meta, categorySlug: e.target.value }), touch(), setErrors({ ...errors, categorySlug: '' }))} error={errors.categorySlug}>
          <option value="">Choose a category</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <ChipInput label="Tags" values={meta.tags} onChange={(tags) => (setMeta({ ...meta, tags }), touch())} max={20} normalise={(s) => tagSlug(s).replace(/-/g, ' ')} hint="Press Enter after each tag." placeholder="e.g. dashboard" error={errors.tags} />
        <TextArea label="Description" optional value={meta.description} maxLength={5000} rows={4} onChange={(e) => (setMeta({ ...meta, description: e.target.value }), touch())} error={errors.description} />
        {teams.length > 0 && (
          <SelectField label="Publish for a team" optional value={meta.teamUsername} onChange={(e) => (setMeta({ ...meta, teamUsername: e.target.value }), touch())} hint="Shown as “You for Team” on both profiles.">
            <option value="">Just me</option>
            {teams.map((t) => (
              <option key={t.team.username} value={t.team.username}>
                {t.team.displayName}
              </option>
            ))}
          </SelectField>
        )}
        <Switch label="Allow comments" checked={!meta.commentsDisabled} onChange={(v) => (setMeta({ ...meta, commentsDisabled: !v }), touch())} />
        <p className="t-caption text-secondary">
          {images} image{images === 1 ? '' : 's'} · {blocks.length}/{UPLOAD_RULES.maxBlocks} blocks{status === 'published' ? ' · Published' : draftId ? ' · Draft' : ''}
        </p>
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--block" aria-busy={busy === 'publish' || undefined} onClick={() => submit(true)}>
            {status === 'published' ? 'Save changes' : 'Publish'}
          </button>
          {status === 'draft' && (
            <button type="button" className="ui-btn ui-btn--secondary neu-control ui-btn--block" aria-busy={busy === 'draft' || undefined} onClick={() => submit(false)}>
              Save as draft
            </button>
          )}
          {draftId ? (
            <button type="button" className="ui-btn ui-btn--danger-ghost ui-btn--block" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" /> Delete
            </button>
          ) : (
            <Link className="ui-btn ui-btn--ghost ui-btn--block" href={viewer.kind === 'member' ? `/${viewer.username}` : '/'}>
              Cancel
            </Link>
          )}
        </div>
      </aside>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this shot?"
        body="It disappears immediately and is permanently removed after 30 days."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          const r = await deleteDraft(draftId!);
          setConfirmDelete(false);
          if (!r.ok) return toast({ tone: 'error', text: r.message });
          setDirty(false);
          toast({ tone: 'success', text: 'Shot deleted.' });
          router.push(viewer.kind === 'member' ? `/${viewer.username}` : '/');
        }}
      />
    </div>
  );
}
