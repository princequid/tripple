import { mediaUrl } from '@/lib/media';

/** C14 Avatar: the uploaded image when present (R2), otherwise initials on the lavender tint (D-26f). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const s = (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '');
  return s.toUpperCase() || '?';
}

export function Avatar({ name, avatarKey, size = 'xs' }: { name: string; avatarKey: string | null; size?: 'xs' | 'md' | 'lg' | 'xl' }) {
  if (avatarKey) {
    // eslint-disable-next-line @next/next/no-img-element -- custom media host (ADR-010), not next/image in R1
    return <img className={`ui-avatar ui-avatar--${size}`} src={mediaUrl(avatarKey, 'cover-400')} alt="" />;
  }
  return (
    <span className={`ui-avatar ui-avatar--${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
