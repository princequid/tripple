export type PersonListItem = { id: number; username: string; displayName: string; avatarKey: string | null; role?: string };

export type PublicProfile = {
  id: number;
  username: string;
  displayName: string;
  isTeam: boolean;
  isFeaturedStudio: boolean;
  headline: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  /** Only the public contact email the user chose to show (BR-78); never the sign-in email. */
  publicEmail: string | null;
  skills: string[];
  languages: string[];
  avatarKey: string | null;
  memberSince: string;
  /** R2 adds followers/following (FR-48). Unreleased UI may ignore them (BR-45). */
  stats: { shots: number; likesReceived: number; followers: number; following: number };
  socialLinks: { platform: string; url: string }[];
  /** Team accounts: members. Individuals: teams they belong to. */
  members: PersonListItem[];
  teams: PersonListItem[];
  isOwn: boolean;
  /** R2: whether the viewer follows this profile; null for visitors, the owner, or when not requested. */
  isFollowing: boolean | null;
  suspended: boolean;
};

export type UsernameCheck = { username: string; available: boolean; problem: 'invalid' | 'reserved' | 'taken' | null };
