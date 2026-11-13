import { redirect } from 'next/navigation';

/** /settings → /settings/profile (IA §6.3). */
export default function SettingsIndex() {
  redirect('/settings/profile');
}
