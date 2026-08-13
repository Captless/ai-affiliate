import { Store } from "./store";
import type {
  GenerationJob,
  GenerationSettings,
} from "../types/generation";

export interface GenerationUiState {
  settings: GenerationSettings;
  poseId: string;
  styleId: string;
  userPrompt: string;
  generatedPrompt: string;
  jobs: GenerationJob[];
  submitting: boolean;
  isPolling: boolean;
}

export const DEFAULT_SETTINGS: GenerationSettings = {
  aspect_ratio: "3:4",
  resolution: "1k",
  output_format: "png",
  enable_image_search: false,
  enable_web_search: false,
};

export const DEFAULT_UI_STATE: GenerationUiState = {
  settings: { ...DEFAULT_SETTINGS },
  poseId: "casual-standing",
  styleId: "natural",
  userPrompt: "",
  generatedPrompt: "",
  jobs: [],
  submitting: false,
  isPolling: false,
};

export const generationStore = new Store<GenerationUiState>({
  ...DEFAULT_UI_STATE,
});
