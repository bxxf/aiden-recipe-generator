/**
 * Session Store - handles secure storage of Fellow credentials.
 * Uses OS keychain (via keytar) when available, falls back to JSON file.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { APP_ID, getAppDataDir } from '@/config';

/** Stored Fellow session data */
export type Session = {
  email: string;
  accessToken: string;
  refreshToken?: string;
  obtainedAtMs: number;
  accessTokenExpMs?: number;
};

const KEYCHAIN_SERVICE = APP_ID;
const KEYCHAIN_ACCOUNT = 'fellow-session';

type KeytarModule = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

/** Cached keytar module to avoid repeated dynamic imports */
let keytarCache: KeytarModule | null | undefined;

/** Try to load keytar for secure keychain storage (cached) */
async function getKeytar(): Promise<KeytarModule | null> {
  if (keytarCache !== undefined) return keytarCache;
  try {
    const mod: { default?: KeytarModule } & Partial<KeytarModule> = await import('keytar');
    keytarCache = (mod.default ?? mod) as KeytarModule;
  } catch (err) {
    console.error('keytar not available, falling back to file storage:', err instanceof Error ? err.message : err);
    keytarCache = null;
  }
  return keytarCache;
}

function sessionPath() {
  return join(getAppDataDir(), 'session.json');
}

/**
 * Stores Fellow session securely.
 * Prefers OS keychain (macOS Keychain, Windows Credential Manager) via keytar.
 * Falls back to JSON file if keytar unavailable (warning: credentials stored in plaintext).
 */
export class SessionStore {
  private warnedAboutPlaintext = false;

  /** Read session from keychain or file */
  async read(): Promise<Session | null> {
    const keytar = await getKeytar();
    if (keytar) {
      const raw = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Session;
      } catch (err) {
        console.error('Failed to parse session from keychain:', err);
        return null;
      }
    }

    try {
      const raw = await readFile(sessionPath(), 'utf8');
      return JSON.parse(raw) as Session;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to read session file:', err);
      }
      return null;
    }
  }

  /** Write session to keychain or file */
  async write(session: Session): Promise<void> {
    const keytar = await getKeytar();
    if (keytar) {
      await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, JSON.stringify(session));
      return;
    }

    // Warn once about plaintext storage
    if (!this.warnedAboutPlaintext) {
      console.error('WARNING: Storing credentials in plaintext file. Install keytar for secure OS keychain storage.');
      this.warnedAboutPlaintext = true;
    }

    await mkdir(getAppDataDir(), { recursive: true });
    await writeFile(sessionPath(), JSON.stringify(session, null, 2), { mode: 0o600 });
  }

  /** Clear stored session */
  async clear(): Promise<void> {
    const keytar = await getKeytar();
    if (keytar) {
      await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
      return;
    }

    await rm(sessionPath(), { force: true });
  }
}

/** Decode JWT expiration timestamp (no verification, just reads exp claim) */
export function decodeJwtExpMs(token: string): number | undefined {
  const parts = token.split('.');
  if (parts.length < 2) return undefined;

  const payloadB64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
  const pad = payloadB64.length % 4 === 0 ? '' : '='.repeat(4 - (payloadB64.length % 4));
  const payloadJson = Buffer.from(payloadB64 + pad, 'base64').toString('utf8');

  try {
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}
