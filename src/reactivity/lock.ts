export let VALUE_LOCKED = true;

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
