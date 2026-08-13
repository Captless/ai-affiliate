export type ApiKeyStatus = "untested" | "active" | "error" | "disabled";

export interface ApiKey {
  id: string;
  label: string;
  masked: string;
  status: ApiKeyStatus;
  is_enabled: boolean;
  is_primary: boolean;
  last_error: string | null;
  last_success_at: string | null;
  last_checked_at: string | null;
  balance: number | null;
  created_at: string;
  updated_at: string;
}
