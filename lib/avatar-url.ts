import { getAuthApiRoot } from "@/lib/_core/booxin-api";

export function resolveAvatarDisplayUrl(
  avatarUrl?: string | null,
  preferredApiRoot?: string
): string | null {
  if (!avatarUrl?.trim()) {
    return null;
  }

  const trimmed = avatarUrl.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("file://")
  ) {
    return trimmed;
  }

  let normalizedPath = trimmed.replace(/^\/+/, "");
  if (!normalizedPath.toLowerCase().startsWith("api/auth/")) {
    normalizedPath = `api/auth/${normalizedPath}`;
  }

  const root = (preferredApiRoot ?? getAuthApiRoot()).replace(/\/+$/, "");
  return `${root}/${normalizedPath}`;
}
