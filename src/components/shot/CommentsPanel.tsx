'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { deleteComment, editComment, likeComment, listComments, postComment } from '@/services/social';
import type { CommentDto, CommentThread } from '@/services/contracts';
import { timeAgo } from '@/services/reference';
import { useSession } from '../providers/AppProviders';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { ErrorState, ListSkeleton, EmptyState } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { ReportDialog } from '../social/ReportDialog';

/**
 * OV-04 comments panel (S-04, BR-48…52): side panel ≥ md, bottom sheet below. One reply level, edit within
 * 15 minutes ("edited"), delete (author or shot owner), comment likes (not own), disabled state, report.
 * Bodies are plain text: rendered as text with preserved line breaks; URLs auto-linked (nofollow ugc).
 */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="comment__body">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} className="text-link" href={p} rel="nofollow ugc noopener noreferrer" target="_blank">
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

function Composer({ onSubmit, placeholder, autoFocus, initial = '', submitLabel = 'Post', onCancel }: { onSubmit: (body: string) => Promise<string | null>; placeholder: string; autoFocus?: boolean; initial?: string; submitLabel?: string; onCancel?: () => void }) {
  const [body, setBody] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="comment-composer"
      onSubmit={async (e) => {
        e.preventDefault();
        const t = body.trim();
        if (!t) return setError('Write something first.');
        if (t.length > 2000) return setError('Comments are at most 2,000 characters.');
        setBusy(true);
        const err = await onSubmit(t);
        setBusy(false);
        if (err) return setError(err);
        setBody('');
      }}
      noValidate
    >
      <label className="visually-hidden" htmlFor={`c-${placeholder}`}>
        {placeholder}
      </label>
      <textarea
        id={`c-${placeholder}`}
        className="ui-input ui-textarea neu-field"
        rows={2}
        maxLength={2000}
        value={body}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        onChange={(e) => (setBody(e.target.value), setError(null))}
      />
      {error && (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" aria-busy={busy || undefined}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function CommentItem({ c, shotId, owner, onChanged, reply }: { c: CommentDto; shotId: number; owner: string; onChanged: () => void; reply?: boolean }) {
  const { viewer, requireMember } = useSession();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [report, setReport] = useState(false);
  const [like, setLike] = useState({ on: Boolean(c.isLiked), n: c.likesCount });
  const toast = useToast();
  const isOwn = viewer.kind === 'member' && viewer.username === c.author.username;

  if (c.deleted) {
    return (
      <li className="comment comment--deleted">
        <p className="t-body-sm text-secondary">This comment was deleted.</p>
        {c.replies.length > 0 && (
          <ul className="comment__replies">
            {c.replies.map((r) => (
              <CommentItem key={r.id} c={r} shotId={shotId} owner={owner} onChanged={onChanged} reply />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const toggleLike = async () => {
    if (!requireMember('comment-shot', 'like comments', shotId)) return;
    const prev = like;
    setLike({ on: !prev.on, n: prev.n + (prev.on ? -1 : 1) });
    const r = await likeComment(c.id, !prev.on);
    if (!r.ok) {
      setLike(prev);
      toast({ tone: 'error', text: r.message });
    }
  };

  return (
    <li className="comment">
      <div className="comment__head">
        <Link href={`/${c.author.username}`} className="comment__author">
          <Avatar name={c.author.displayName} avatarKey={c.author.avatarKey} size="xs" />
          {c.author.displayName}
        </Link>
        {c.author.username === owner && <span className="ui-badge ui-badge--neutral">Author</span>}
        <time className="t-caption text-secondary" dateTime={c.createdAt}>
          {timeAgo(c.createdAt)}
          {c.editedAt && ' · edited'}
        </time>
      </div>
      {editing ? (
        <Composer
          initial={c.body}
          placeholder="Edit your comment"
          submitLabel="Save"
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            const r = await editComment(c.id, body);
            if (!r.ok) return r.message;
            setEditing(false);
            onChanged();
            return null;
          }}
        />
      ) : (
        <Linkified text={c.body} />
      )}
      <div className="comment__actions">
        {!isOwn && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm comment__like" aria-pressed={like.on} onClick={toggleLike} aria-label={`Like comment by ${c.author.displayName}`}>
            <Icon name="heart" /> {like.n > 0 ? like.n : ''}
          </button>
        )}
        {isOwn && like.n > 0 && (
          <span className="t-caption text-secondary">
            {like.n} like{like.n === 1 ? '' : 's'}
          </span>
        )}
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => requireMember('comment-shot', 'reply to comments', shotId) && setReplying((r) => !r)}>
          Reply
        </button>
        {c.canEdit && !editing && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        {c.canDelete && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setConfirm(true)}>
            Delete
          </button>
        )}
        {!isOwn && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => requireMember(null, 'report comments') && setReport(true)}>
            Report
          </button>
        )}
      </div>
      {replying && (
        <Composer
          placeholder={`Reply to ${c.author.displayName}`}
          autoFocus
          submitLabel="Reply"
          onCancel={() => setReplying(false)}
          onSubmit={async (body) => {
            const r = await postComment(shotId, owner, body, c.id);
            if (!r.ok) return r.message;
            setReplying(false);
            onChanged();
            return null;
          }}
        />
      )}
      {!reply && c.replies.length > 0 && (
        <ul className="comment__replies">
          {c.replies.map((r) => (
            <CommentItem key={r.id} c={r} shotId={shotId} owner={owner} onChanged={onChanged} reply />
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete comment?"
        body="This can’t be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          setConfirm(false);
          const r = await deleteComment(c.id);
          if (r.ok) {
            toast({ tone: 'success', text: 'Comment deleted.' });
            onChanged();
          } else toast({ tone: 'error', text: r.message });
        }}
      />
      <ReportDialog open={report} onClose={() => setReport(false)} target={{ type: 'comment', id: c.id, label: `Comment by ${c.author.displayName}`, href: `/shots/${shotId}` }} />
    </li>
  );
}

export function CommentsPanel({ open, onClose, shotId, owner, title, onCount }: { open: boolean; onClose: () => void; shotId: number; owner: string; title: string; onCount?: (n: number) => void }) {
  const { viewer, requireMember } = useSession();
  const [thread, setThread] = useState<CommentThread | null>(null);
  const [failed, setFailed] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);

  const load = async () => {
    setFailed(false);
    const r = await listComments(shotId, owner);
    if (r.ok) {
      setThread(r.data);
      setCursor(r.page?.nextCursor ?? null);
      onCount?.(r.data.total);
    } else setFailed(true);
  };
  const loadMore = async () => {
    if (!cursor) return;
    setMoreBusy(true);
    const r = await listComments(shotId, owner, cursor);
    setMoreBusy(false);
    if (!r.ok) return;
    setThread((t) => (t ? { ...r.data, comments: [...t.comments, ...r.data.comments.filter((c) => !t.comments.some((x) => x.id === c.id))] } : r.data));
    setCursor(r.page?.nextCursor ?? null);
  };
  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shotId]);

  return (
    <Modal open={open} onClose={onClose} variant="side" title={`Comments${thread ? ` (${thread.total})` : ''}`} description={title}>
      {failed ? (
        <ErrorState title="Couldn’t load comments" onRetry={load} />
      ) : !thread ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="stack">
          {thread.disabled ? (
            <div className="ui-card ui-card--muted">
              <p className="t-body-sm">Comments are turned off for this shot.</p>
            </div>
          ) : viewer.kind === 'member' ? (
            <Composer
              placeholder="Add a comment"
              onSubmit={async (body) => {
                const r = await postComment(shotId, owner, body, null);
                if (!r.ok) return r.message;
                await load();
                return null;
              }}
            />
          ) : (
            <button type="button" className="ui-btn ui-btn--on-glass ui-btn--block" onClick={() => requireMember('comment-shot', 'join the conversation', shotId)}>
              Sign in to comment
            </button>
          )}
          {thread.comments.length === 0 ? (
            <EmptyState icon="message" title="No comments yet" body={thread.disabled ? undefined : 'Be the first to share what you think.'} />
          ) : (
            <ul className="comment-list">
              {thread.comments.map((c) => (
                <CommentItem key={c.id} c={c} shotId={shotId} owner={owner} onChanged={load} />
              ))}
            </ul>
          )}
          {cursor && (
            <button type="button" className="ui-btn ui-btn--on-glass ui-btn--block" onClick={loadMore} aria-busy={moreBusy || undefined}>
              Load more comments
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
