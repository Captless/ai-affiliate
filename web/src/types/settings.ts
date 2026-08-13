export interface AppSettings {
  key_selection: "auto" | "manual";
  manual_key_id: string | null;
  open_browser: boolean;
  port: number;
}
