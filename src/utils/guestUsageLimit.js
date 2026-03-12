import FingerprintJS from '@fingerprintjs/fingerprintjs';

const STORAGE_KEY = 'guestScoreUsage';
const SCORE_LIMIT = 10;

let cachedVisitorId = null;

/**
 * Get a stable device fingerprint using FingerprintJS.
 * Falls back to a random ID stored in localStorage if fingerprinting fails.
 */
export async function getDeviceId() {
  if (cachedVisitorId) return cachedVisitorId;

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
  } catch {
    // Fallback: use a random ID persisted in localStorage
    let fallback = localStorage.getItem('guestDeviceId');
    if (!fallback) {
      fallback = 'fb_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('guestDeviceId', fallback);
    }
    cachedVisitorId = fallback;
  }

  return cachedVisitorId;
}

/**
 * Read local usage counts from localStorage.
 */
function getLocalUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { placementScoreCount: 0, atsScoreCount: 0 };
  } catch {
    return { placementScoreCount: 0, atsScoreCount: 0 };
  }
}

/**
 * Save local usage counts to localStorage.
 */
function setLocalUsage(usage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

/**
 * Check if the guest is allowed to perform a score check.
 * Uses localStorage as a fast gate and backend as the authoritative source.
 * @param {'placement' | 'ats'} scoreType
 * @param {string} apiBase - Backend base URL
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function checkGuestLimit(scoreType, apiBase) {
  // If user is logged in, always allow
  if (localStorage.getItem('userData')) {
    return { allowed: true, remaining: Infinity };
  }

  // Fast local gate first
  const localUsage = getLocalUsage();
  const localKey = scoreType === 'placement' ? 'placementScoreCount' : 'atsScoreCount';
  if (localUsage[localKey] >= SCORE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  // Check backend for authoritative count
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${apiBase}/api/guest/check-limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, scoreType })
    });
    const data = await res.json();
    if (data.success) {
      // Sync local with backend
      localUsage[localKey] = SCORE_LIMIT - data.remaining;
      setLocalUsage(localUsage);
      return { allowed: data.allowed, remaining: data.remaining };
    }
  } catch {
    // If backend unreachable, rely on local count
  }

  const remaining = Math.max(0, SCORE_LIMIT - localUsage[localKey]);
  return { allowed: remaining > 0, remaining };
}

/**
 * Record a successful score check (call AFTER the score is returned).
 * @param {'placement' | 'ats'} scoreType
 * @param {string} apiBase
 */
export async function recordGuestUsage(scoreType, apiBase) {
  // Skip for logged-in users
  if (localStorage.getItem('userData')) return;

  // Increment local count immediately
  const localUsage = getLocalUsage();
  const localKey = scoreType === 'placement' ? 'placementScoreCount' : 'atsScoreCount';
  localUsage[localKey] = (localUsage[localKey] || 0) + 1;
  setLocalUsage(localUsage);

  // Increment in backend
  try {
    const deviceId = await getDeviceId();
    await fetch(`${apiBase}/api/guest/increment-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, scoreType })
    });
  } catch {
    // Local count already incremented, backend will catch up
  }
}

export { SCORE_LIMIT };
