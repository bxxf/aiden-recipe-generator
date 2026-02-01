/**
 * Application configuration and constants.
 */

import { homedir } from 'node:os';
import { join } from 'node:path';

export const APP_ID = 'aiden-ai-profile-generator';
export const APP_VERSION = '0.1.0';

/** Fellow's API endpoint (reverse-engineered from mobile app) */
export const FELLOW_API_BASE = 'https://l8qtmnc692.execute-api.us-west-2.amazonaws.com/v1';

/** HTTP request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Community Aiden recipes spreadsheet */
export const DEFAULT_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1mi-YS6JYfbX3wN1kZd6iu_q6mFlWM4Ah6N3Ox8eqRCA/export?format=csv&gid=0';

/** Local data directory (~/.aiden-ai-profile-generator) */
export function getAppDataDir() {
  return join(homedir(), `.${APP_ID}`);
}
