import type { Snapshot } from '../models/types';

/**
 * Cloud sync seam. The default adapter is a no-op so the diary stays on-device.
 * A future adapter can push and pull the same Snapshot the backup buttons use.
 */
export interface DiarySyncAdapter {
  pull(): Promise<Snapshot | null>;
  push(snapshot: Snapshot): Promise<void>;
}

export const localOnlySync: DiarySyncAdapter = {
  async pull() {
    return null;
  },
  async push() {},
};
