import { appStore } from "../state/appState";
import { el } from "../utils/dom";
import { formatBalance } from "../utils/formatting";

export class Header {
  constructor(private container: HTMLElement) {
    appStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const app = appStore.get();

    const enabledKeys = app.keys.filter((k) => k.is_enabled);
    const balance = enabledKeys.reduce((sum, k) => sum + (k.balance ?? 0), 0);
    const hasBalance = enabledKeys.length > 0 && balance > 0;

    const brand = el("div", { class: "flex items-baseline gap-3" }, [
      el("span", { class: "display-title text-[22px] tracking-tight" }, ["AI Affiliate Studio"]),
      el("span", { class: "font-mono text-[10px] text-faint tracking-[0.25em] uppercase hidden md:inline" }, ["Nano Banana 2"]),
    ]);

    const balancePill = el("div", {
      class: "hidden sm:flex items-center gap-2 border border-line px-3 py-1.5",
      title: "Combined balance of enabled WaveSpeed API keys",
    }, [
      el("span", {
        class: "w-1.5 h-1.5 rounded-full shrink-0",
        style: `background:${hasBalance ? "var(--good)" : "var(--bad)"}`,
      }),
      el("span", {
        class: `font-mono text-xs ${hasBalance ? "text-good" : "text-bad"}`,
      }, [formatBalance(balance)]),
    ]);

    const accessBtn = el(
      "button",
      {
        class: "btn",
        type: "button",
        title: "Manage WaveSpeed API keys",
      },
      ["Add API", el("span", { class: "font-mono text-[10px] text-faint" }, [String(app.keys.length)])]
    );
    accessBtn.addEventListener("click", () => {
      appStore.update((s) => ({ ...s, apiKeysOpen: true }));
    });

    const bar = el("header", { class: "flex items-center justify-between gap-4 py-4" }, [
      brand,
      el("div", { class: "flex items-center gap-3" }, [balancePill, accessBtn]),
    ]);
    this.container.appendChild(bar);
  }
}
