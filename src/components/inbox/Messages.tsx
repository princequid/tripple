'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getThread, listThreads, MESSAGE_POLL_MS, replyToThread } from '@/services/inbox';
import type { MessageDto, ThreadDetail } from '@/services/contracts';
import { timeAgo } from '@/services/reference';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';

/** SCR-51 inbox: threads with last message, unread count; active thread highlighted (two-pane ≥ lg). */
export function ThreadList({ activeId }: { activeId?: number }) {
  const path = usePathname();
  const res = useResource(() => listThreads(), [path]);
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={4} />;
  if (res.data.length === 0)
    return <EmptyState icon="message" title="No messages yet" body="Start a conversation from a designer’s profile, a shot or a service." action={<Link className="ui-btn ui-btn--primary" href="/hire">Find designers</Link>} />;
  return (
    <ul className="thread-list" aria-label="Conversations">
      {res.data.map((t) => (
        <li key={t.id}>
          <Link className={`thread-row${t.unread ? ' is-unread' : ''}`} href={`/messages/${t.id}`} aria-current={t.id === activeId ? 'page' : undefined}>
            <Avatar name={t.other.displayName} avatarKey={t.other.avatarKey} size="md" />
            <span className="thread-row__text">
              <span className="row-between">
                <strong>{t.other.displayName}</strong>
                {t.lastMessage && <time className="t-caption text-secondary">{timeAgo(t.lastMessage.at)}</time>}
              </span>
              <span className="thread-row__preview">
                {t.lastMessage ? `${t.lastMessage.fromMe ? 'You: ' : ''}${t.lastMessage.body}` : 'No messages'}
              </span>
            </span>
            {t.unread > 0 && (
              <span className="ui-badge ui-badge--accent" aria-label={`${t.unread} unread`}>
                {t.unread}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** SCR-52 conversation (BR-82): bubbles, optimistic send with retry, polling every 15 s while open. */
export function Conversation({ id }: { id: number }) {
  const [data, setData] = useState<ThreadDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const load = async (quiet = false) => {
    const r = await getThread(id);
    if (r.ok) {
      setData((prev) => {
        const pending = prev?.messages.filter((m) => m.status) ?? [];
        return { ...r.data, messages: [...r.data.messages, ...pending] };
      });
      setState('ready');
    } else if (!quiet) setState(r.code === 'NOT_FOUND' ? 'missing' : 'error');
  };
  useEffect(() => {
    void load();
    const t = setInterval(() => document.visibilityState === 'visible' && void load(true), MESSAGE_POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages.length]);

  const send = async (text: string, tempId = -Date.now()) => {
    const temp: MessageDto = { id: tempId, threadId: id, from: data!.thread.other, body: text, createdAt: new Date().toISOString(), fromMe: true, status: 'sending' };
    setData((d) => d && { ...d, messages: [...d.messages.filter((m) => m.id !== tempId), temp] });
    const r = await replyToThread(id, text);
    setData((d) => d && { ...d, messages: d.messages.map((m) => (m.id === tempId ? (r.ok ? r.data : { ...m, status: 'failed' }) : m)) });
    if (!r.ok) setError(r.message);
  };

  if (state === 'missing') return <EmptyState icon="message" title="Conversation not found" action={<Link className="ui-btn ui-btn--primary" href="/messages">Back to messages</Link>} />;
  if (state === 'error') return <ErrorState onRetry={() => load()} />;
  if (!data) return <ListSkeleton rows={4} />;
  const other = data.thread.other;

  return (
    <section className="conversation" aria-label={`Conversation with ${other.displayName}`}>
      <header className="conversation__head">
        <Link className="ui-icon-btn ui-btn--ghost conversation__back" href="/messages" aria-label="Back to messages">
          <Icon name="arrowLeft" />
        </Link>
        <Link href={`/${other.username}`} className="cluster comment__author">
          <Avatar name={other.displayName} avatarKey={other.avatarKey} size="md" />
          <strong>{other.displayName}</strong>
        </Link>
        {data.thread.context && (
          <Link className="ui-chip conversation__context" href={data.thread.context.href}>
            About: {data.thread.context.label}
          </Link>
        )}
      </header>
      <ol className="conversation__list" aria-live="polite">
        {data.messages.map((m) => (
          <li key={m.id} className={`bubble${m.fromMe ? ' bubble--me' : ''}${m.status === 'failed' ? ' is-failed' : ''}`}>
            <p className="bubble__body">{m.body}</p>
            <span className="bubble__meta">
              {m.status === 'sending' ? (
                'Sending…'
              ) : m.status === 'failed' ? (
                <>
                  Not sent ·{' '}
                  <button type="button" className="link-button text-link" onClick={() => void send(m.body, m.id)}>
                    Retry
                  </button>
                </>
              ) : (
                <time dateTime={m.createdAt}>{timeAgo(m.createdAt)}</time>
              )}
            </span>
          </li>
        ))}
      </ol>
      <div ref={end} />
      {data.canReply ? (
        <form
          className="conversation__composer"
          onSubmit={(e) => {
            e.preventDefault();
            const t = body.trim();
            if (!t) return setError('Write a message first.');
            if (t.length > 5000) return setError('Messages are at most 5,000 characters.');
            setBody('');
            setError(null);
            void send(t);
          }}
        >
          <label className="visually-hidden" htmlFor="reply">
            Message {other.displayName}
          </label>
          <textarea
            id="reply"
            className="ui-input ui-textarea neu-field"
            rows={2}
            maxLength={5000}
            value={body}
            placeholder={`Message ${other.displayName}`}
            onChange={(e) => (setBody(e.target.value), setError(null))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button type="submit" className="ui-btn ui-btn--primary" aria-label="Send message">
            <Icon name="send" />
          </button>
          {error && (
            <p className="ui-field__error conversation__error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <p className="ui-card ui-card--muted t-body-sm">You can’t reply to this conversation.</p>
      )}
    </section>
  );
}
