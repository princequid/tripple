/** Who is making the request (USER_ROLES §2). Resolved once per request by the entry layer. */
export type Viewer =
  | { kind: 'visitor' }
  | { kind: 'pending'; userId: string; name: string; email: string }
  | {
      kind: 'member';
      userId: string;
      profileId: number;
      username: string;
      displayName: string;
      avatarKey: string | null;
      role: 'member' | 'moderator' | 'admin';
    };

export type Member = Extract<Viewer, { kind: 'member' }>;

export const isStaff = (v: Viewer) => v.kind === 'member' && (v.role === 'moderator' || v.role === 'admin');
