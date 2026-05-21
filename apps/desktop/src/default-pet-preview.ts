import { app } from "electron";
import { stat } from "node:fs/promises";
import { join } from "node:path";

import { getAppStateSnapshot } from "./app-state.js";
import { getInstalledPetDir } from "./pet-paths.js";
import { defaultPetSprite } from "./reaction-animation-mapping.js";

export const defaultPetPreviewSpriteUrlBase = "openpets-pet-preview://spritesheet/default";

export interface DefaultPetPreviewSpriteInfo {
  readonly path: string;
  readonly version: string;
  readonly url: string;
}

export async function getDefaultPetPreviewSpriteInfo(): Promise<DefaultPetPreviewSpriteInfo> {
  const state = getAppStateSnapshot();
  const selected = state.pets.installed.find((pet) => pet.id === state.preferences.defaultPetId);
  const builtInPath = join(app.getAppPath(), "assets", defaultPetSprite.fileName);
  const candidatePath = selected && !selected.broken && !selected.builtIn
    ? join(getInstalledPetDir(selected.id), "spritesheet.webp")
    : builtInPath;
  try {
    const spritesheet = await stat(candidatePath);
    if (spritesheet.isFile() && spritesheet.size > 0 && spritesheet.size <= 100 * 1024 * 1024) {
      const version = `${selected?.id ?? "builtin"}-${Math.round(spritesheet.mtimeMs)}-${spritesheet.size}`;
      return { path: candidatePath, version, url: `${defaultPetPreviewSpriteUrlBase}?v=${encodeURIComponent(version)}` };
    }
  } catch {
    // Fall back to the bundled pet if an installed default disappears while UI is open.
  }
  const fallback = await stat(builtInPath);
  const version = `builtin-${Math.round(fallback.mtimeMs)}-${fallback.size}`;
  return { path: builtInPath, version, url: `${defaultPetPreviewSpriteUrlBase}?v=${encodeURIComponent(version)}` };
}
