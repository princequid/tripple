'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { answerInvitation, createTeam, getTeamAdmin, myTeams, teamAction, type TeamOp } from '@/services/account';
import { listBlocked, setBlocked } from '@/services/social';
import { closeJob, jobPath, myJobs } from '@/services/jobs';
import type { TeamRole } from '@/services/contracts';
import { USERNAME_HINT } from '@/lib/username';
import { useResource } from '@/hooks/useResource';
import { useSession } from '../providers/AppProviders';
import { SelectField, TextField } from '../ui/Field';
import { ConfirmDialog } from '../ui/Modal';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { JobRow } from '../jobs/JobBoard';

const ROLE: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

/** SCR-33 Settings → Teams: my teams, pending invitations (accept/decline), create team. */
export function TeamsView() {
  const res = useResource(() => myTeams(), []);
  const toast = useToast();
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={3} />;
  const { teams, invitations } = res.data;
  return (
    <div className="stack settings-sections">
      {invitations.length > 0 && (
        <section className="ui-card stack" aria-labelledby="inv-title">
          <h2 id="inv-title" className="ui-card__title">
            Invitations
          </h2>
          <ul className="settings-list">
            {invitations.map((i) => (
              <li key={i.id} className="settings-row">
                <Avatar name={i.team.displayName} avatarKey={i.team.avatarKey} size="md" />
                <div className="settings-row__main">
                  <strong>{i.team.displayName}</strong>
                  <span className="t-caption text-secondary">
                    {i.invitedBy ? `${i.invitedBy.displayName} invited you` : 'You were invited'} as {ROLE[i.role].toLowerCase()}
                  </span>
                </div>
                <div className="cluster">
                  {[true, false].map((accept) => (
                    <button
                      key={String(accept)}
                      type="button"
                      className={`ui-btn ui-btn--sm ${accept ? 'ui-btn--primary' : 'ui-btn--ghost'}`}
                      onClick={async () => {
                        const r = await answerInvitation(i.id, accept);
                        if (!r.ok) return toast({ tone: 'error', text: r.message });
                        toast({ tone: 'success', text: accept ? `You joined ${i.team.displayName}.` : 'Invitation declined.' });
                        await res.reload();
                      }}
                    >
                      {accept ? 'Accept' : 'Decline'}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="ui-card stack" aria-labelledby="teams-title">
        <div className="row-between">
          <h2 id="teams-title" className="ui-card__title">
            Your teams
          </h2>
          <Link className="ui-btn ui-btn--secondary neu-control ui-btn--sm" href="/teams/new">
            <Icon name="plus" /> Create a team
          </Link>
        </div>
        {teams.length === 0 ? (
          <p className="t-body-sm text-secondary">You’re not in any team yet. Teams let a studio publish shots together under one profile.</p>
        ) : (
          <ul className="settings-list">
            {teams.map((t) => (
              <li key={t.team.username} className="settings-row">
                <Avatar name={t.team.displayName} avatarKey={t.team.avatarKey} size="md" />
                <div className="settings-row__main">
                  <Link className="text-link" href={`/${t.team.username}`}>
                    {t.team.displayName}
                  </Link>
                  <span className="t-caption text-secondary">
                    {ROLE[t.role]} · {t.membersCount} member{t.membersCount === 1 ? '' : 's'}
                  </span>
                </div>
                <Link className="ui-btn ui-btn--ghost ui-btn--sm" href={`/settings/teams/${t.team.username}`}>
                  Manage
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** SCR-34 team administration (BR-57/58): profile, invite, roles, remove, transfer, leave, delete. */
export function TeamAdminView({ team }: { team: string }) {
  const res = useResource(() => getTeamAdmin(team), [team]);
  const { viewer } = useSession();
  const [invite, setInvite] = useState({ username: '', role: 'member' as 'admin' | 'member', error: null as string | null });
  const [profile, setProfile] = useState<{ displayName: string; headline: string; websiteUrl: string } | null>(null);
  const [pErr, setPErr] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ title: string; body: string; label: string; op: TeamOp } | null>(null);
  const toast = useToast();
  const router = useRouter();

  if (res.status === 'error') return res.code === 'NOT_FOUND' ? <EmptyState icon="users" title="Team not found" body="You may not be a member of this team." action={<Link className="ui-btn ui-btn--primary" href="/settings/teams">Your teams</Link>} /> : <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={4} />;
  const t = res.data;
  const me = viewer.kind === 'member' ? viewer.username : '';
  const isOwner = t.myRole === 'owner';
  const isAdmin = isOwner || t.myRole === 'admin';
  const p = profile ?? { displayName: t.team.displayName, headline: t.team.headline ?? '', websiteUrl: t.team.websiteUrl ?? '' };

  const run = async (op: TeamOp, success: string) => {
    const r = await teamAction(team, op);
    if (!r.ok) {
      toast({ tone: 'error', text: r.message });
      return false;
    }
    toast({ tone: 'success', text: success });
    if (op.op === 'delete' || op.op === 'leave') router.push('/settings/teams');
    else await res.reload();
    return true;
  };

  return (
    <div className="stack settings-sections">
      <p className="t-body-sm">
        <Link className="text-link" href="/settings/teams">
          <Icon name="arrowLeft" size={14} /> Your teams
        </Link>{' '}
        · You are {ROLE[t.myRole].toLowerCase()} of{' '}
        <Link className="text-link" href={`/${t.team.username}`}>
          {t.team.displayName}
        </Link>
      </p>
      {isAdmin && (
        <section className="ui-card stack" aria-labelledby="tp-title">
          <h2 id="tp-title" className="ui-card__title">
            Team profile
          </h2>
          <form
            className="stack"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await teamAction(team, { op: 'profile', ...p });
              if (!r.ok) return setPErr(r.fields ?? { displayName: r.message });
              toast({ tone: 'success', text: 'Team profile saved.' });
              setProfile(null);
              await res.reload();
            }}
          >
            <div className="form-grid form-grid--2">
              <TextField label="Team name" value={p.displayName} maxLength={50} onChange={(e) => setProfile({ ...p, displayName: e.target.value })} error={pErr.displayName} />
              <TextField label="Website" optional value={p.websiteUrl} onChange={(e) => setProfile({ ...p, websiteUrl: e.target.value })} error={pErr.websiteUrl} placeholder="https://" />
              <TextField className="span-2" label="Headline" optional value={p.headline} maxLength={120} onChange={(e) => setProfile({ ...p, headline: e.target.value })} />
            </div>
            <div>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!profile}>
                Save team profile
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="ui-card stack" aria-labelledby="tm-title">
        <h2 id="tm-title" className="ui-card__title">
          Members ({t.members.length})
        </h2>
        {isAdmin && (
          <form
            className="settings-inline"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const u = invite.username.trim().replace(/^@/, '').toLowerCase();
              if (!u) return setInvite({ ...invite, error: 'Enter a username.' });
              const r = await teamAction(team, { op: 'invite', username: u, role: invite.role });
              if (!r.ok) return setInvite({ ...invite, error: r.message });
              toast({ tone: 'success', text: `Invitation sent to @${u}.` });
              setInvite({ username: '', role: 'member', error: null });
              await res.reload();
            }}
          >
            <TextField label="Invite by username" value={invite.username} onChange={(e) => setInvite({ ...invite, username: e.target.value, error: null })} error={invite.error} placeholder="@username" />
            <SelectField label="Role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as 'admin' | 'member' })}>
              <option value="member">Member</option>
              {isOwner && <option value="admin">Admin</option>}
            </SelectField>
            <button type="submit" className="ui-btn ui-btn--secondary neu-control">
              Send invite
            </button>
          </form>
        )}
        <ul className="settings-list">
          {t.members.map((m) => {
            const self = m.person.username === me;
            return (
              <li key={m.person.username} className="settings-row">
                <Avatar name={m.person.displayName} avatarKey={m.person.avatarKey} size="md" />
                <div className="settings-row__main">
                  <Link className="text-link" href={`/${m.person.username}`}>
                    {m.person.displayName}
                    {self && ' (you)'}
                  </Link>
                  <span className="t-caption text-secondary">@{m.person.username}</span>
                </div>
                {isOwner && !self && m.role !== 'owner' ? (
                  <div className="ui-select role-select">
                    <label className="visually-hidden" htmlFor={`role-${m.person.username}`}>
                      Role for {m.person.displayName}
                    </label>
                    <select id={`role-${m.person.username}`} className="ui-input neu-field" value={m.role} onChange={(e) => void run({ op: 'role', username: m.person.username, role: e.target.value as 'admin' | 'member' }, 'Role updated.')}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Icon name="chev" className="ui-select__chev" />
                  </div>
                ) : (
                  <span className={`ui-badge ${m.role === 'owner' ? 'ui-badge--accent' : 'ui-badge--neutral'}`}>{ROLE[m.role]}</span>
                )}
                {!self && isAdmin && m.role !== 'owner' && !(t.myRole === 'admin' && m.role === 'admin') && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setConfirm({ title: `Remove ${m.person.displayName}?`, body: 'They lose access to publish for this team. Their past team shots stay attributed.', label: 'Remove', op: { op: 'remove', username: m.person.username } })}>
                    Remove
                  </button>
                )}
                {isOwner && !self && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setConfirm({ title: `Make ${m.person.displayName} the owner?`, body: 'You become an admin. Only the new owner can transfer ownership back or delete the team.', label: 'Transfer ownership', op: { op: 'transfer', username: m.person.username } })}>
                    Make owner
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {t.pending.length > 0 && (
          <>
            <h3 className="t-label">Pending invitations</h3>
            <ul className="settings-list">
              {t.pending.map((pi) => (
                <li key={pi.username} className="settings-row">
                  <Icon name="mail" />
                  <div className="settings-row__main">
                    <strong>@{pi.username}</strong>
                    <span className="t-caption text-secondary">Invited as {ROLE[pi.role].toLowerCase()}</span>
                  </div>
                  {isAdmin && (
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => void run({ op: 'cancel-invite', id: pi.id, username: pi.username }, 'Invitation cancelled.')}>
                      Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="ui-card stack danger-zone" aria-labelledby="tz-title">
        <h2 id="tz-title" className="ui-card__title">
          {isOwner ? 'Delete team' : 'Leave team'}
        </h2>
        <p className="t-body-sm">{isOwner ? 'Deleting removes the team profile. Shots stay with their individual authors.' : 'You can rejoin only if an admin invites you again.'}</p>
        <div>
          <button
            type="button"
            className="ui-btn ui-btn--danger-ghost"
            onClick={() =>
              setConfirm(
                isOwner
                  ? { title: `Delete ${t.team.displayName}?`, body: 'This cannot be undone.', label: 'Delete team', op: { op: 'delete' } }
                  : { title: `Leave ${t.team.displayName}?`, body: 'You will no longer be able to publish for this team.', label: 'Leave team', op: { op: 'leave', username: me } },
              )
            }
          >
            {isOwner ? 'Delete team' : 'Leave team'}
          </button>
        </div>
      </section>
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        body={confirm?.body}
        confirmLabel={confirm?.label ?? ''}
        danger={confirm?.op.op !== 'transfer'}
        onConfirm={async () => {
          const c = confirm!;
          setConfirm(null);
          await run(c.op, c.op.op === 'delete' ? 'Team deleted.' : c.op.op === 'leave' ? 'You left the team.' : c.op.op === 'transfer' ? 'Ownership transferred.' : 'Member removed.');
        }}
      />
    </div>
  );
}

/** SCR-35 create a team (BR-57: own username, same rules as people). */
export function CreateTeamForm() {
  const [v, setV] = useState({ username: '', displayName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  return (
    <form
      className="ui-card form-card stack"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await createTeam(v.username, v.displayName);
        setBusy(false);
        if (!r.ok) return setErrors(r.fields ?? { form: r.message });
        toast({ tone: 'success', text: `${v.displayName} created. Invite your teammates next.` });
        router.push(`/settings/teams/${r.data.username}`);
      }}
    >
      {errors.form && (
        <div className="ui-alert ui-alert--error" role="alert">
          {errors.form}
        </div>
      )}
      <TextField label="Team name" value={v.displayName} maxLength={50} onChange={(e) => (setV({ ...v, displayName: e.target.value }), setErrors({ ...errors, displayName: '' }))} error={errors.displayName} data-autofocus />
      <TextField label="Team username" value={v.username} maxLength={30} onChange={(e) => (setV({ ...v, username: e.target.value.toLowerCase() }), setErrors({ ...errors, username: '' }))} error={errors.username} hint={`Your team page: /${v.username || 'username'}. ${USERNAME_HINT}`} />
      <div className="form-actions">
        <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
          Create team
        </button>
        <Link className="ui-btn ui-btn--ghost" href="/settings/teams">
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** SCR-36 Settings → Jobs (FR-70): my jobs with status; Edit, Close. */
export function MyJobsView() {
  const res = useResource(() => myJobs(), []);
  const [closing, setClosing] = useState<number | null>(null);
  const toast = useToast();
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={3} />;
  if (res.data.length === 0) return <EmptyState icon="briefcase" title="You haven’t posted any jobs" body="Free listings run for 30 days. You can have up to 3 active at once." action={<Link className="ui-btn ui-btn--primary" href="/jobs/new">Post a job</Link>} />;
  return (
    <>
      <ul className="job-list">
        {res.data.map((j) => (
          <JobRow
            key={j.id}
            j={j}
            actions={
              <div className="cluster">
                <Link className="ui-btn ui-btn--ghost ui-btn--sm" href={jobPath(j)}>
                  View
                </Link>
                {j.status === 'active' && (
                  <>
                    <Link className="ui-btn ui-btn--ghost ui-btn--sm" href={`/jobs/${j.id}/edit`}>
                      Edit
                    </Link>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setClosing(j.id)}>
                      Close
                    </button>
                  </>
                )}
              </div>
            }
          />
        ))}
      </ul>
      <ConfirmDialog
        open={closing !== null}
        onClose={() => setClosing(null)}
        title="Close this job?"
        body="It leaves the board immediately."
        confirmLabel="Close job"
        danger
        onConfirm={async () => {
          const r = await closeJob(closing!);
          setClosing(null);
          if (!r.ok) return toast({ tone: 'error', text: r.message });
          toast({ tone: 'success', text: 'Job closed.' });
          await res.reload();
        }}
      />
    </>
  );
}

/** SCR-58 Settings → Blocked members (S-06): unblock. */
export function BlockedView() {
  const res = useResource(() => listBlocked(), []);
  const toast = useToast();
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={2} />;
  if (res.data.length === 0) return <EmptyState icon="block" title="You haven’t blocked anyone" body="Block someone from the menu on their profile. They aren’t told." />;
  return (
    <ul className="settings-list">
      {res.data.map((b) => (
        <li key={b.person.username} className="settings-row">
          <Avatar name={b.person.displayName} avatarKey={b.person.avatarKey} size="md" />
          <div className="settings-row__main">
            <Link className="text-link" href={`/${b.person.username}`}>
              {b.person.displayName}
            </Link>
            <span className="t-caption text-secondary">@{b.person.username}</span>
          </div>
          <button
            type="button"
            className="ui-btn ui-btn--secondary neu-control ui-btn--sm"
            onClick={async () => {
              const r = await setBlocked(b.person.username, false);
              if (!r.ok) return toast({ tone: 'error', text: r.message });
              toast({ tone: 'success', text: `${b.person.displayName} is unblocked.` });
              await res.reload();
            }}
          >
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}
