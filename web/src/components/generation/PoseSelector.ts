import { generationStore } from "../../state/generationState";
import { POSES, getPose } from "../../services/promptService";
import { el } from "../../utils/dom";

export class PoseSelector {
  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const state = generationStore.get();

    const sectionHeader = el("div", { class: "mb-5" }, [
      el("div", { class: "section-index mb-2" }, ["03 / Pose"]),
      el("h2", { class: "display-title text-3xl" }, ["Pose Presets"]),
      el("p", { class: "mt-2 text-xs text-muted max-w-md" }, [
        "Choose a pose direction or roll for one. It feeds the prompt alongside your references, style and own notes.",
      ]),
    ]);

    const header = el("div", { class: "flex items-center justify-between mb-2.5" }, [
      el("span", { class: "eyebrow" }, ["Selected pose"]),
      el("button", { class: "chip", type: "button" }, ["Random"]),
    ]);
    (header.lastChild as HTMLElement).addEventListener("click", () => {
      const random = POSES[Math.floor(Math.random() * POSES.length)];
      generationStore.update((s) => ({ ...s, poseId: random.id }));
    });

    const list = el("div", { class: "pose-list" }, [
      ...POSES.map((pose) => {
        const chip = el("button", {
          class: "pose-chip",
          type: "button",
          "data-active": String(state.poseId === pose.id),
        }, [pose.label]);
        chip.addEventListener("click", () => {
          generationStore.update((s) => ({ ...s, poseId: pose.id }));
        });
        return chip;
      }),
    ]);

    const selected = getPose(state.poseId);
    const description = el("p", { class: "mt-3 text-[11px] leading-relaxed text-faint" }, [
      selected.description,
    ]);

    this.container.append(sectionHeader, header, list, description);
  }
}
