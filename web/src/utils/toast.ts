const container = document.getElementById("toasts") as HTMLElement;

export type ToastKind = "ok" | "err";

export function toast(message: string, kind: ToastKind = "ok", duration = 4200): void {
  const node = document.createElement("div");
  node.className = `toast ${kind === "err" ? "err" : "ok"}`;
  node.textContent = message;
  container.appendChild(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transition = "opacity 200ms ease";
    setTimeout(() => node.remove(), 220);
  }, duration);
}
