import { appStore } from "../../state/appState";
import {
  deleteKey,
  refreshBalance,
  updateKey,
} from "../../services/apiKeyService";
import { el } from "../../utils/dom";
import { formatBalance } from "../../utils/formatting";
import { toast } from "../../utils/toast";
import type { ApiKey } from "../../types/apiKeys";
import { AddKeyModal } from "./AddKeyModal";

export class ApiKeyManager {
  private modal: HTMLElement | null = null;
  private panel: HTMLElement | null = null;

  constructor(private mount: HTMLElement) {
    appStore.subscribe(() => {
      if (appStore.get().apiKeysOpen && !this.modal) this.open();
      if (!appStore.get().apiKeysOpen && this.modal) this.close();
      if (this.modal && this.panel) this.render(this.panel);
    });
  }

  private open(): void {
    const backdrop = el("div", { class: "modal-backdrop" });
    const panel = el("div", { class: "modal-panel" });
    backdrop.appendChild(panel);
    this.mount.appendChild(backdrop);
    this.modal = backdrop;
    this.panel = panel;

    backdrop.addEventListener("pointerdown", (event) => {
      if (event.target === backdrop) this.requestClose();
    });

    this.render(panel);

    const closeModal = () => this.requestClose();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", keydown);
    this.cleanup = () => document.removeEventListener("keydown", keydown);
  }

  private cleanup: (() => void) | null = null;

  private close(): void {
    this.cleanup?.();
    this.cleanup = null;
    this.modal?.remove();
    this.modal = null;
    this.panel = null;
  }

  private requestClose(): void {
    appStore.update((s) => ({ ...s, apiKeysOpen: false }));
  }

  private render(panel: HTMLElement): void {
    panel.replaceChildren();
    const app = appStore.get();

    const header = el("div", { class: "px-6 pt-6 pb-5 border-b border-line" }, [
      el("div", { class: "flex items-start justify-between gap-4" }, [
        el("div", {}, [
          el("div", { class: "eyebrow mb-1" }, ["WaveSpeed API access"]),
          el("h3", { class: "display-title text-2xl" }, ["API Keys"]),
        ]),
        el("button", { class: "chip", type: "button" }, ["Close"]),
      ]),
      el("p", { class: "text-[11px] text-faint mt-2 leading-relaxed" }, [
        "Keys are stored locally in data/app.db, masked in the UI, and never leave this machine.",
      ]),
    ]);
    (header.querySelector(".chip") as HTMLElement).addEventListener("click", () => this.requestClose());

    const summary = this.buildSummary(app);

    const body = el("div", { class: "px-6 py-5" }, [
      summary,
      el("div", { class: "rule my-5" }),
      el("div", { class: "flex items-center justify-between mt-6 mb-3" }, [
        el("div", {}, [
          el("span", { class: "eyebrow" }, ["Stored keys"]),
          el("span", { class: "font-mono text-[10px] text-faint ml-2" }, [`${app.keys.length}`]),
        ]),
        el("button", { class: "btn-primary !py-1.5 !px-3", type: "button" }, ["Add key"]),
      ]),
      el("div", { class: "space-y-3" }, [
        ...(app.keys.length ? app.keys.map((key) => this.buildKeyCard(key)) : [this.buildEmpty()]),
      ]),
    ]);

    const addBtn = body.querySelector("button.btn-primary") as HTMLElement;
    addBtn.addEventListener("click", () => {
      new AddKeyModal(this.mount, () => this.render(panel));
    });

    panel.append(header, body);
  }

  private buildSummary(app: ReturnType<typeof appStore.get>): HTMLElement {
    const enabled = app.keys.filter((k) => k.is_enabled);
    const balance = enabled.reduce((sum, k) => sum + (k.balance ?? 0), 0);
    const balanceKnown = enabled.length > 0;
    const primary = app.keys.find((k) => k.is_primary);

    const cell = (label: string, value: string, accent = false): HTMLElement =>
      el("div", { class: "border border-line bg-[#131211] px-4 py-3 flex flex-col gap-1" }, [
        el("span", { class: "font-mono text-[9px] uppercase tracking-[0.2em] text-faint" }, [label]),
        el("span", {
          class: `font-mono text-sm ${accent ? "text-brass" : "text-paper"}`,
        }, [value]),
      ]);

    return el("div", { class: "grid grid-cols-3 gap-3" }, [
      cell("Balance", balanceKnown ? formatBalance(balance) : "no keys", true),
      cell("Enabled", `${enabled.length} of ${app.keys.length}`),
      cell("Active", primary ? primary.label : "-"),
    ]);
  }

  private buildKeyCard(key: ApiKey): HTMLElement {
    const app = appStore.get();
    const busy = app.busyKeyId === key.id;

    const statusDot = el("span", {
      class: "w-1.5 h-1.5 rounded-full shrink-0",
      style: `background:${this.statusColor(key)}`,
    });

    const labelRow = el("div", { class: "flex items-center gap-3 min-w-0" }, [
      statusDot,
      el("span", { class: "text-sm font-medium text-paper truncate" }, [key.label]),
      key.is_primary ? el("span", { class: "font-mono text-[9px] uppercase tracking-[0.2em] text-brass border border-[#e06c2f55] px-1.5 py-0.5" }, ["active"]) : null,
    ]);

    const masked = el("span", { class: "font-mono text-[11px] text-muted" }, [key.masked]);

    const balance = el("div", { class: "flex flex-col items-end shrink-0" }, [
      el("span", { class: "font-mono text-[9px] uppercase tracking-[0.2em] text-faint" }, ["balance"]),
      el("span", {
        class: `font-mono text-sm mt-0.5 ${key.balance === null ? "text-faint" : "text-paper"}`,
      }, [formatBalance(key.balance)]),
    ]);

    const actions = el("div", { class: "flex items-center gap-2 mt-3" }, [
      this.refreshIcon(busy, () => this.run(key.id, () => refreshBalance(key.id))),
      key.is_primary
        ? this.keyAction(false, "Active", undefined, false, true)
        : this.keyAction(false, "Use", () =>
            updateKey(key.id, { is_primary: true }).catch((e) => toast(e.message, "err"))
          ),
      this.keyAction(false, "Remove", () => this.remove(key), true),
    ]);

    const card = el("div", { class: "border border-line bg-[#131211] px-4 py-3.5" }, [
      el("div", { class: "flex items-start justify-between gap-4" }, [
        el("div", { class: "min-w-0" }, [labelRow, el("div", { class: "mt-1.5 flex items-center gap-2" }, [masked])]),
        balance,
      ]),
      actions,
    ]);
    return card;
  }

  private refreshIcon(busy: boolean, handler: () => void): HTMLElement {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (busy) svg.classList.add("icon-spin");
    const path1 = document.createElementNS(ns, "path");
    path1.setAttribute("d", "M21 12a9 9 0 1 1-3-6.7");
    const path2 = document.createElementNS(ns, "path");
    path2.setAttribute("d", "M21 3v6h-6");
    svg.append(path1, path2);

    const button = el("button", {
      class: "chip !px-2.5",
      type: "button",
      title: "Refresh API key",
      disabled: busy ? "true" : null,
    }, [svg]);
    button.addEventListener("click", handler);
    return button;
  }

  private keyAction(busy: boolean, label: string, handler?: () => void, danger = false, disabled = false): HTMLElement {
    const button = el("button", {
      class: `chip${danger ? " !text-bad hover:!border-[rgba(208,139,122,0.5)]" : ""}`,
      type: "button",
      disabled: busy || disabled ? "true" : null,
    }, [busy ? el("span", { class: "spinner" }) : null, label]);
    if (handler) button.addEventListener("click", handler);
    return button;
  }

  private async run(keyId: string, task: () => Promise<unknown>): Promise<void> {
    appStore.update((s) => ({ ...s, busyKeyId: keyId }));
    try {
      await task();
      toast("Done.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Request failed.", "err");
    } finally {
      appStore.update((s) => ({ ...s, busyKeyId: null }));
    }
  }

  private async remove(key: ApiKey): Promise<void> {
    if (!window.confirm(`Remove API key "${key.label}"?`)) return;
    try {
      await deleteKey(key.id);
      toast("Key removed.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not remove key.", "err");
    }
  }

  private statusColor(key: ApiKey): string {
    if (!key.is_enabled) return "var(--faint)";
    switch (key.status) {
      case "active": return "var(--good)";
      case "error": return "var(--bad)";
      default: return "var(--brass)";
    }
  }

  private buildEmpty(): HTMLElement {
    return el("div", { class: "border border-dashed border-[#443e35] py-12 flex flex-col items-center gap-2 text-center" }, [
      el("span", { class: "text-xs text-muted" }, ["No API keys stored yet."]),
      el("span", { class: "text-[10px] text-faint max-w-xs" }, [
        "Add a WaveSpeed API key to generate images. Keys are masked in the UI and never leave your machine.",
      ]),
    ]);
  }
}
