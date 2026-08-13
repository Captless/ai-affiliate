import { api } from "./api";
import { appStore } from "../state/appState";
import type { ApiKey } from "../types/apiKeys";
import type { AppSettings } from "../types/settings";

interface KeysResponse {
  keys: ApiKey[];
}

interface SettingsResponse {
  settings: AppSettings;
}

export async function loadKeys(): Promise<ApiKey[]> {
  const data = await api.get<KeysResponse>("/api/keys");
  appStore.update((state) => ({ ...state, keys: data.keys }));
  return data.keys;
}

export async function addKey(label: string, key: string): Promise<ApiKey> {
  const data = await api.post<{ key: ApiKey }>("/api/keys", { label, key });
  await loadKeys();
  return data.key;
}

export async function deleteKey(id: string): Promise<void> {
  await api.del<{ ok: boolean }>(`/api/keys/${id}`);
  await loadKeys();
}

export async function updateKey(
  id: string,
  patch: { label?: string; is_enabled?: boolean; is_primary?: boolean }
): Promise<ApiKey> {
  const data = await api.put<{ key: ApiKey }>(`/api/keys/${id}`, patch);
  await loadKeys();
  return data.key;
}

export async function testKey(id: string): Promise<ApiKey> {
  const data = await api.post<{ key: ApiKey }>(`/api/keys/${id}/test`);
  await loadKeys();
  return data.key;
}

export async function refreshBalance(id: string): Promise<ApiKey> {
  const data = await api.get<{ key: ApiKey }>(`/api/keys/${id}/balance`);
  await loadKeys();
  return data.key;
}

export async function loadSettings(): Promise<AppSettings> {
  const data = await api.get<SettingsResponse>("/api/settings");
  appStore.update((state) => ({ ...state, settings: data.settings }));
  return data.settings;
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const data = await api.put<SettingsResponse>("/api/settings", patch);
  appStore.update((state) => ({ ...state, settings: data.settings }));
  return data.settings;
}
