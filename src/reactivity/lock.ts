export let TRACK_LOCKED = true;
export let VALUE_LOCKED = true;

function lockTrack(): void {
  TRACK_LOCKED = true;
}

function unlockTrack(): void {
  TRACK_LOCKED = false;
}

function lockValue(): void {
  VALUE_LOCKED = true;
}

function unlockValue(): void {
  VALUE_LOCKED = false;
}

export function mutation(fn: () => void): void {
  unlockValue();
  fn();
  lockValue();
}

export function trace(fn: () => void): void {
  unlockTrack();
  fn();
  lockTrack();
}
