/**
 * User Settings - persisted preferences across sessions.
 * Stored in ~/.aiden-ai-profile-generator/user-settings.json
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAppDataDir } from '@/config';

/** Persisted user preferences */
export type UserSettings = {
  /** Grinder model (e.g., "Comandante C40", "Fellow Ode Gen 2") */
  grinder?: string;
  /** Default Aiden device ID */
  defaultDeviceId?: string;
  /** Preferred brew ratio (e.g., 16 = 1:16) */
  preferredRatio?: number;
  /** Elevation in meters (affects boiling point/extraction) */
  elevation?: number;
  /** Any other notes */
  notes?: string;
};

const SETTINGS_FILE = 'user-settings.json';

async function getPath(): Promise<string> {
  const dir = getAppDataDir();
  await mkdir(dir, { recursive: true });
  return join(dir, SETTINGS_FILE);
}

/** Get current user settings */
export async function getSettings(): Promise<UserSettings> {
  try {
    const data = await readFile(await getPath(), 'utf-8');
    return JSON.parse(data) as UserSettings;
  } catch {
    return {};
  }
}

/** Update user settings (merges with existing) */
export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...patch };
  await writeFile(await getPath(), JSON.stringify(updated, null, 2));
  return updated;
}
