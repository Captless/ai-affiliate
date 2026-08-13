type Listener = () => void;

export class Store<T> {
  private value: T;
  private listeners = new Set<Listener>();

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T {
    return this.value;
  }

  set(next: T): void {
    this.value = next;
    this.emit();
  }

  update(fn: (prev: T) => T): void {
    this.value = fn(this.value);
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  emit(): void {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}
