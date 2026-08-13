import { Store } from "./store";
import type { ApiKey } from "../types/apiKeys";
import type { AppSettings } from "../types/settings";
import type { GenerationJob } from "../types/generation";

export interface AppState {
  keys: ApiKey[];
  settings: AppSettings;
  apiKeysOpen: boolean;
  busyKeyId: string | null;
  viewerJob: GenerationJob | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  key_selection: "auto",
  manual_key_id: null,
  open_browser: true,
  port: 8000,
};

export const appStore = new Store<AppState>({
  keys: [],
  settings: { ...DEFAULT_APP_SETTINGS },
  apiKeysOpen: false,
  busyKeyId: null,
  viewerJob: null,
});
