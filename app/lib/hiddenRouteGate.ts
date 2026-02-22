"use client";

const OUR_PLACE_GATE_STORAGE_KEY = "mds-our-place-gate-v1";
const OUR_PLACE_GATE_TTL_MS = 60_000;

type GatePayload = {
  token: string;
  expiresAt: number;
  consumedAt?: number;
};

const OUR_PLACE_GATE_REMOUNT_GRACE_MS = 10_000;

const randomToken = () => {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

export const armOurPlaceGate = () => {
  if (typeof window === "undefined") return;
  const payload: GatePayload = {
    token: randomToken(),
    expiresAt: Date.now() + OUR_PLACE_GATE_TTL_MS,
  };
  window.sessionStorage.setItem(OUR_PLACE_GATE_STORAGE_KEY, JSON.stringify(payload));
};

export const consumeOurPlaceGate = () => {
  if (typeof window === "undefined") return false;
  const raw = window.sessionStorage.getItem(OUR_PLACE_GATE_STORAGE_KEY);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw) as Partial<GatePayload>;
    if (typeof payload.expiresAt !== "number") {
      window.sessionStorage.removeItem(OUR_PLACE_GATE_STORAGE_KEY);
      return false;
    }
    const now = Date.now();
    if (payload.expiresAt <= now) {
      window.sessionStorage.removeItem(OUR_PLACE_GATE_STORAGE_KEY);
      return false;
    }
    if (typeof payload.consumedAt === "number") {
      const isWithinRemountGrace = now - payload.consumedAt <= OUR_PLACE_GATE_REMOUNT_GRACE_MS;
      if (!isWithinRemountGrace) {
        window.sessionStorage.removeItem(OUR_PLACE_GATE_STORAGE_KEY);
      }
      return isWithinRemountGrace;
    }
    const nextPayload: GatePayload = {
      token: String(payload.token ?? ""),
      expiresAt: payload.expiresAt,
      consumedAt: now,
    };
    window.sessionStorage.setItem(OUR_PLACE_GATE_STORAGE_KEY, JSON.stringify(nextPayload));
    return true;
  } catch {
    window.sessionStorage.removeItem(OUR_PLACE_GATE_STORAGE_KEY);
    return false;
  }
};
