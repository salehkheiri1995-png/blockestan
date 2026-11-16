import {
  AppSaveData,
  createDefaultSave,
  decodeSave,
  encodeSave,
  sanitizeSaveData,
} from '../engine/persistence';

const PRIMARY_KEY = 'blockestan_save_v1';
const BACKUP_KEY = 'blockestan_save_backup_v1';

export interface LoadReport {
  data: AppSaveData;
  recoveredFromBackup: boolean;
  error: string | null;
}

export function loadSaveFromStorage(): LoadReport {
  try {
    const rawPrimary = localStorage.getItem(PRIMARY_KEY);
    if (rawPrimary) {
      try {
        return {
          data: decodeSave(rawPrimary),
          recoveredFromBackup: false,
          error: null,
        };
      } catch {
        const rawBackup = localStorage.getItem(BACKUP_KEY);
        if (rawBackup) {
          try {
            return {
              data: decodeSave(rawBackup),
              recoveredFromBackup: true,
              error: null,
            };
          } catch {
            // Fall through to fresh save
          }
        }
        return {
          data: createDefaultSave(),
          recoveredFromBackup: false,
          error: 'فایل ذخیره خراب بود و ذخیرهٔ تازه ساخته شد.',
        };
      }
    }

    const rawBackup = localStorage.getItem(BACKUP_KEY);
    if (rawBackup) {
      try {
        return {
          data: decodeSave(rawBackup),
          recoveredFromBackup: true,
          error: null,
        };
      } catch {
        // Ignore corrupt backup
      }
    }
  } catch {
    // Storage unavailable
  }
  return {
    data: createDefaultSave(),
    recoveredFromBackup: false,
    error: null,
  };
}

export function writeSaveToStorage(data: AppSaveData, nowMs = Date.now()): void {
  try {
    const sanitized = sanitizeSaveData(data);
    const existing = localStorage.getItem(PRIMARY_KEY);
    if (existing) {
      localStorage.setItem(BACKUP_KEY, existing);
    }
    localStorage.setItem(PRIMARY_KEY, encodeSave(sanitized, nowMs));
  } catch {
    // Non-fatal in private browsing or quota limits
  }
}
