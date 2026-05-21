import { readFile, stat } from "node:fs/promises";

import { protocol } from "electron";

import { readCodexPetSpritesheet } from "./codex-pets.js";
import { getDefaultPetPreviewSpriteInfo } from "./default-pet-preview.js";

export function installInternalUiProtocol(): void {
  protocol.handle("openpets-codex", async (request) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
      const url = new URL(request.url);
      if (url.hostname !== "spritesheet" || url.search || url.hash) return new Response(null, { status: 404 });
      const petId = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const spritesheet = await readCodexPetSpritesheet(petId);
      return new Response(spritesheet, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=60",
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });

  protocol.handle("openpets-pet-preview", async (request) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
      const url = new URL(request.url);
      if (url.hostname !== "spritesheet" || url.pathname !== "/default" || url.hash) return new Response(null, { status: 404 });
      const version = url.searchParams.get("v");
      if ([...url.searchParams.keys()].some((key) => key !== "v") || (version !== null && !/^[a-z0-9_-]{1,64}-\d+-\d+$/.test(version))) return new Response(null, { status: 404 });
      const { path } = await getDefaultPetPreviewSpriteInfo();
      const spritesheet = await stat(path);
      if (!spritesheet.isFile() || spritesheet.size <= 0 || spritesheet.size > 100 * 1024 * 1024) return new Response(null, { status: 404 });
      return new Response(await readFile(path), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
}
