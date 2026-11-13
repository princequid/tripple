import { sourceOf, type Feature } from '@/services/config';
import { Icon } from '../Icon';

/**
 * Honest data-source label: shown only while a feature runs on the mock service layer (backend pending), so
 * reviewers know changes are stored in this browser only. Disappears automatically when the feature goes live.
 */
export function PreviewNote({ feature }: { feature: Feature }) {
  if (sourceOf(feature) === 'live') return null;
  return (
    <p className="preview-note" data-testid="preview-note">
      <Icon name="info" size={16} />
      Preview data: this feature’s backend is not connected yet, so changes are saved in this browser only.
    </p>
  );
}
