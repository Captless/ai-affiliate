import { generationStore } from "../../state/generationState";
import { POSES } from "../../services/promptService";
import { el } from "../../utils/dom";

export class PoseSelector {
  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const state = generationStore.get();

    const header = el("div", { class: "flex items-center justify-between mb-3" }, [
      el("span", { class: "eyebrow" }, ["Pose"]),
    ]);

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

    this.container.append(header, list);
  }
}
