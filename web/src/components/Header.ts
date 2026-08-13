import { appStore } from "../state/appState";
import { generationStore } from "../state/generationState";
import { el } from "../utils/dom";

export class Header {
  constructor(private container: HTMLElement) {
    appStore.subscribe(() => this.render());
    generationStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const app = appStore.get();
    const gen = generationStore.get();

    const activeCount = app.keys.filter((k) => k.is_enabled).length;
    const anyKey = activeCount > 0;
    const polling = gen.isPolling;

    const brand = el("div", { class: "flex items-baseline gap-3" }, [
      el("span", { class: "display-title text-2xl tracking-tight" }, ["AI Affiliate Studio"]),
      el("span", { class: "font-mono text-[10px] text-faint tracking-[0.3em] uppercase" }, ["Nano Banana 2"]),
    ]);

    const statusDot = el("span", {
      class: "w-1.5 h-1.5 rounded-full",
      style: `background:${anyKey ? "var(--good)" : "var(--bad)"}`,
    });
    const statusText = anyKey
      ? `${activeCount} key${activeCount === 1 ? "" : "s"} ready`
      : "no api key";

    const status = el("div", { class: "hidden sm:flex items-center gap-2 font-mono text-[10px] text-muted tracking-wide uppercase" }, [
      polling ? el("span", { class: "spinner" }) : statusDot,
      el("span", {}, [statusText]),
    ]);

    const accessBtn = el(
      "button",
      {
        class: "btn",
        type: "button",
        title: "Manage WaveSpeed API keys",
      },
      ["API Access", el("span", { class: "font-mono text-[10px] text-faint" }, [String(app.keys.length)])]
    );
    accessBtn.addEventListener("click", () => {
      appStore.update((s) => ({ ...s, apiKeysOpen: true }));
    });

    const bar = el("header", { class: "flex items-center justify-between gap-4 py-6" }, [
      brand,
      el("div", { class: "flex items-center gap-4" }, [status, accessBtn]),
    ]);
    this.container.appendChild(bar);
  }
}
