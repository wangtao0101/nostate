export let TRACK_LOCKED = false;
export let VALUE_LOCKED = true;

export function lockTrack(): void {
  TRACK_LOCKED = true;
}

export function unlockTrack(): void {
  TRACK_LOCKED = false;
}

export function lockValue(): void {
  VALUE_LOCKED = true;
}

export function unlockValue(): void {
  VALUE_LOCKED = false;
}

export function mutation(fn: () => void): void {
  try {
    unlockValue();
    fn();
  } finally {
    lockValue();
  }
}
