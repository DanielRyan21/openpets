import assert from "node:assert/strict";

import { CONTROL_CENTER_MAX_CATALOG_PAGE, assertAuthorizedControlCenterSender, assertControlCenterBooleanInput, assertControlCenterPetScaleInput, assertControlCenterSafePetId, assertControlCenterSafePluginCommandId, assertControlCenterSafePluginId, buildControlCenterDashboardSnapshot, buildControlCenterPetsSnapshot, buildControlCenterReactionMappingSnapshot, buildControlCenterSettingsSnapshot, handleControlCenterCheckForUpdatesRequest, handleControlCenterGetAgentSetupSnapshotRequest, handleControlCenterGetCodexPetsSnapshotRequest, handleControlCenterGetPetCatalogPageRequest, handleControlCenterGetPetCatalogSearchRequest, handleControlCenterGetPetCatalogSnapshotRequest, handleControlCenterGetPetsSnapshotRequest, handleControlCenterGetPluginCatalogSnapshotRequest, handleControlCenterGetPluginsSnapshotRequest, handleControlCenterGetReactionMappingSnapshotRequest, handleControlCenterLoadLocalPluginRequest, handleControlCenterOpenUpdateReleasePageRequest, handleControlCenterPetMutationRequest, handleControlCenterPluginCommandRequest, handleControlCenterPluginConfigRequest, handleControlCenterPluginEnabledRequest, handleControlCenterPluginIdMutationRequest, handleControlCenterResetDefaultPetPositionRequest, handleControlCenterRunAgentSetupActionRequest, handleControlCenterSetLaunchAtLoginRequest, handleControlCenterSetPetScaleRequest, handleControlCenterSetReactionAnimationOverrideRequest, handleControlCenterUpdateAgentSetupCommandPathsRequest, mutateControlCenterPet, resetControlCenterDefaultPetPosition, resetControlCenterReactionAnimationOverride, resetControlCenterReactionAnimationOverrides, setControlCenterLaunchAtLogin, setControlCenterPetScale, setControlCenterReactionAnimationOverride, type ControlCenterReactionMappingMutationDependencies, type ControlCenterSnapshotDependencies } from "../src/control-center-ipc-core.js";

const authorizedSender = { id: 1 };
type LoginItemSetterSettings = { readonly openAtLogin: boolean; readonly openAsHidden: true };

assert.doesNotThrow(() => assertAuthorizedControlCenterSender(authorizedSender, authorizedSender));
assert.throws(() => assertAuthorizedControlCenterSender({ id: 2 }, authorizedSender), /unauthorized sender/);
assert.throws(() => assertAuthorizedControlCenterSender(authorizedSender, null), /unauthorized sender/);
assert.doesNotThrow(() => assertControlCenterBooleanInput(true, "launchAtLogin.enabled"));
assert.doesNotThrow(() => assertControlCenterBooleanInput(false, "launchAtLogin.enabled"));
assert.throws(() => assertControlCenterBooleanInput("true", "launchAtLogin.enabled"), /expected boolean/);
assert.throws(() => assertControlCenterBooleanInput(1, "launchAtLogin.enabled"), /expected boolean/);
assert.doesNotThrow(() => assertControlCenterPetScaleInput(0.56, [{ value: 0.44 }, { value: 0.56 }, { value: 0.72 }]));
assert.throws(() => assertControlCenterPetScaleInput(0.5, [{ value: 0.44 }, { value: 0.56 }, { value: 0.72 }]), /supported pet scale option/);
assert.throws(() => assertControlCenterPetScaleInput("0.56", [{ value: 0.44 }, { value: 0.56 }, { value: 0.72 }]), /supported pet scale option/);
assert.doesNotThrow(() => assertControlCenterSafePetId("pet-ok"));
assert.throws(() => assertControlCenterSafePetId("builtin"), /invalid pet id/);
assert.doesNotThrow(() => assertControlCenterSafePetId("builtin", { allowBuiltIn: true }));
for (const invalidPetId of ["", "../pet", "Pet", "pet.id", "pet/id", "a".repeat(65)]) assert.throws(() => assertControlCenterSafePetId(invalidPetId), /invalid pet id/);
assert.doesNotThrow(() => assertControlCenterSafePluginId("plugin.ok-1"));
for (const invalidPluginId of ["", "../plugin", "Plugin", "plugin/id", "a", "a".repeat(65)]) assert.throws(() => assertControlCenterSafePluginId(invalidPluginId), /invalid plugin id/);
assert.doesNotThrow(() => assertControlCenterSafePluginCommandId("command.ok:1"));
for (const invalidCommandId of ["", "../command", "command/id", "a".repeat(65)]) assert.throws(() => assertControlCenterSafePluginCommandId(invalidCommandId), /invalid plugin command id/);

const deps: ControlCenterSnapshotDependencies = {
  appVersion: "2.1.1-test",
  state: {
    version: 1,
    preferences: {
      defaultPetId: "pet-ok",
      openDefaultPetOnLaunch: true,
      speechBubblesEnabled: true,
      petScale: 0.72,
      reactionAnimationOverrides: { thinking: "review", success: "jumping" },
      onboardingCompleted: true,
    },
    pets: {
      installed: [
        { id: "pet-broken", displayName: "Broken", builtIn: false, protected: false, installed: true, broken: true },
        { id: "pet-ok", displayName: "Test Pet", builtIn: false, protected: false, installed: true },
      ],
    },
    defaultPet: {},
  },
  updateStatus: { state: "available", currentVersion: "2.1.1", latestVersion: "2.2.0", checkedAt: 1234, error: "ignored? no, included" },
  launchAtLogin: { supported: true, enabled: false },
  petScaleOptions: [{ value: 0.44, label: "Small" }, { value: 0.56, label: "Medium" }, { value: 0.72, label: "Large" }],
  reactionAnimationMetadata: [{ id: "thinking", label: "Thinking", description: "Agent is thinking.", defaultAnimation: "review" }, { id: "success", label: "Success", description: "Task succeeded.", defaultAnimation: "jumping" }, { id: "error", label: "Error", description: "Task failed.", defaultAnimation: "failed" }],
  selectableAnimationMetadata: [{ id: "review", label: "Review", description: "Thinking." }, { id: "jumping", label: "Jumping", description: "Success." }, { id: "failed", label: "Failed", description: "Error." }],
  defaultPetSprite: { previewUrl: "openpets-pet-preview://spritesheet/default?v=builtin-123-456", version: "builtin-123-456", fileName: "default-pet-spritesheet.webp", frameWidth: 192, frameHeight: 208, columns: 8, rows: 9, states: { review: { row: 8, frames: 6, durationMs: 1030 }, jumping: { row: 4, frames: 5, durationMs: 840, iterations: 2 }, failed: { row: 5, frames: 8, durationMs: 1220, iterations: 2 } } },
};

assert.deepEqual(buildControlCenterDashboardSnapshot(deps), {
  appVersion: "2.1.1-test",
  defaultPetName: "Test Pet",
  onboardingCompleted: true,
  updateStatus: { state: "available", currentVersion: "2.1.1", latestVersion: "2.2.0", checkedAt: 1234, error: "ignored? no, included" },
});

assert.deepEqual(buildControlCenterSettingsSnapshot(deps), {
  appVersion: "2.1.1-test",
  onboardingCompleted: true,
  defaultPetName: "Test Pet",
  launchAtLogin: { supported: true, enabled: false },
  updateStatus: { state: "available", currentVersion: "2.1.1", latestVersion: "2.2.0", checkedAt: 1234, error: "ignored? no, included" },
  petScale: { value: 0.72, label: "Large" },
  petScaleOptions: [{ value: 0.44, label: "Small" }, { value: 0.56, label: "Medium" }, { value: 0.72, label: "Large" }],
  reactionAnimations: { totalReactions: 3, overriddenReactions: 2, overrideLabels: ["Thinking", "Success"] },
});

assert.deepEqual(buildControlCenterReactionMappingSnapshot(deps), {
  reactions: [
    { id: "thinking", label: "Thinking", description: "Agent is thinking.", defaultAnimation: "review", currentAnimation: "review", overridden: true },
    { id: "success", label: "Success", description: "Task succeeded.", defaultAnimation: "jumping", currentAnimation: "jumping", overridden: true },
    { id: "error", label: "Error", description: "Task failed.", defaultAnimation: "failed", currentAnimation: "failed", overridden: false },
  ],
  selectableAnimations: [{ id: "review", label: "Review", description: "Thinking." }, { id: "jumping", label: "Jumping", description: "Success." }, { id: "failed", label: "Failed", description: "Error." }],
  overrides: [{ reactionId: "thinking", animationId: "review" }, { reactionId: "success", animationId: "jumping" }],
  spriteMetadata: { previewUrl: "openpets-pet-preview://spritesheet/default?v=builtin-123-456", version: "builtin-123-456", spriteFileName: "default-pet-spritesheet.webp", frameWidth: 192, frameHeight: 208, columns: 8, rows: 9, states: [{ id: "review", row: 8, frames: 6, durationMs: 1030, iterations: undefined }, { id: "jumping", row: 4, frames: 5, durationMs: 840, iterations: 2 }, { id: "failed", row: 5, frames: 8, durationMs: 1220, iterations: 2 }] },
});
let unauthorizedReactionDepsReads = 0;
assert.throws(() => handleControlCenterGetReactionMappingSnapshotRequest({ id: 2 }, authorizedSender, () => { unauthorizedReactionDepsReads += 1; return deps; }), /unauthorized sender/);
assert.equal(unauthorizedReactionDepsReads, 0, "unauthorized reaction mapping sender must not build or read snapshot dependencies");
const authorizedReactionSnapshot = handleControlCenterGetReactionMappingSnapshotRequest(authorizedSender, authorizedSender, () => deps);
assert.equal(authorizedReactionSnapshot.reactions.length, 3, "authorized reaction mapping snapshot read must return mapping data");
assert.equal(authorizedReactionSnapshot.spriteMetadata.previewUrl, "openpets-pet-preview://spritesheet/default?v=builtin-123-456", "reaction mapping contract exposes scoped internal preview URL");
assert.equal(authorizedReactionSnapshot.spriteMetadata.version, "builtin-123-456", "reaction mapping contract exposes preview version");
assert.ok(!JSON.stringify(authorizedReactionSnapshot).includes("/home/") && !JSON.stringify(authorizedReactionSnapshot).includes("file:"), "reaction mapping snapshot must not expose filesystem paths or file URLs");

const petsSnapshot = buildControlCenterPetsSnapshot({ ...deps.state, pets: { installed: [{ id: "catalog-pet", displayName: "Catalog", builtIn: false, protected: false, installed: true, source: { kind: "catalog", catalogVersion: 2, zip: "https://zip.openpets.dev/pets/catalog-pet.zip", preview: "https://openpets.dev/pets/catalog-pet.webp" } }, { id: "codex-pet", displayName: "Codex", builtIn: false, protected: false, installed: true, source: { kind: "codex", path: "/home/alvin/.codex/pets/codex-pet" } }] }, preferences: { ...deps.state.preferences, defaultPetId: "catalog-pet" } });
assert.deepEqual(petsSnapshot.pets.map((pet) => pet.source), [{ kind: "catalog", preview: "https://openpets.dev/pets/catalog-pet.webp" }, { kind: "codex" }]);
assert.ok(!JSON.stringify(petsSnapshot).includes("/home/") && !JSON.stringify(petsSnapshot).includes("zip.openpets.dev"), "pets snapshot must not expose local paths or install zip metadata");
const brokenPetsSnapshot = buildControlCenterPetsSnapshot({ ...deps.state, pets: { installed: [{ id: "broken-secret", displayName: "Broken Secret", builtIn: false, protected: false, installed: true, broken: true, brokenReason: "contains /home/alvin/private path" }] } });
assert.equal(brokenPetsSnapshot.pets[0]?.broken, true);
assert.ok(!JSON.stringify(brokenPetsSnapshot).includes("brokenReason") && !JSON.stringify(brokenPetsSnapshot).includes("/home/alvin/private"), "pets snapshot must omit detailed broken reasons");
for (const preview of ["file:///home/alvin/pet.webp", "http://openpets.dev/pets/pet.webp", "http://localhost:5173/pets/pet.webp", "https://openpets.dev:444/pets/pet.webp", "https://user:pass@openpets.dev/pets/pet.webp", "https://openpets.dev/assets/pet.webp"]) {
  const invalidPreviewSnapshot = buildControlCenterPetsSnapshot({ ...deps.state, pets: { installed: [{ id: `catalog-${preview}`, displayName: "Catalog", builtIn: false, protected: false, installed: true, source: { kind: "catalog", catalogVersion: 2, zip: "https://zip.openpets.dev/pets/pet.zip", preview } }] } });
  assert.deepEqual(invalidPreviewSnapshot.pets[0]?.source, { kind: "catalog" }, `unsafe installed catalog preview must be omitted: ${preview}`);
}
let unauthorizedPetsReads = 0;
assert.throws(() => handleControlCenterGetPetsSnapshotRequest({ id: 2 }, authorizedSender, () => { unauthorizedPetsReads += 1; return deps.state; }), /unauthorized sender/);
assert.equal(unauthorizedPetsReads, 0, "unauthorized pets snapshot must not read app state");

const agentSnapshot = { commandMode: "published", localDevAvailable: false, petOptions: [], commandPaths: { claude: "", node: "", opencode: "" }, busy: false } as never;
let agentSnapshotReads = 0;
await assert.rejects(() => handleControlCenterGetAgentSetupSnapshotRequest({ id: 2 }, authorizedSender, "pet-ok", "published", async () => { agentSnapshotReads += 1; return agentSnapshot; }), /unauthorized sender/);
assert.equal(agentSnapshotReads, 0, "unauthorized integrations snapshot must not call service");
await assert.rejects(() => handleControlCenterGetAgentSetupSnapshotRequest(authorizedSender, authorizedSender, "pet-ok", "remote", async () => { agentSnapshotReads += 1; return agentSnapshot; }), /invalid agent setup command mode/);
assert.equal(agentSnapshotReads, 0, "invalid command mode must not call integrations snapshot service");
const authorizedAgentSnapshot = await handleControlCenterGetAgentSetupSnapshotRequest(authorizedSender, authorizedSender, "pet-ok", "published", async (petId, mode) => { agentSnapshotReads += 1; assert.equal(petId, "pet-ok"); assert.equal(mode, "published"); return agentSnapshot; });
assert.equal(authorizedAgentSnapshot, agentSnapshot);
assert.equal(agentSnapshotReads, 1, "authorized integrations snapshot must call service once");
let agentActionCalls = 0;
await assert.rejects(() => handleControlCenterRunAgentSetupActionRequest({ id: 2 }, authorizedSender, "configure", "pet-ok", "published", async () => { agentActionCalls += 1; return agentSnapshot; }), /unauthorized sender/);
await assert.rejects(() => handleControlCenterRunAgentSetupActionRequest(authorizedSender, authorizedSender, "spawn-shell", "pet-ok", "published", async () => { agentActionCalls += 1; return agentSnapshot; }), /invalid agent setup action/);
assert.equal(agentActionCalls, 0, "unauthorized/invalid integrations actions must not call service");
await handleControlCenterRunAgentSetupActionRequest(authorizedSender, authorizedSender, "configure", "pet-ok", "published", async (action) => { agentActionCalls += 1; assert.equal(action, "configure"); return agentSnapshot; });
assert.equal(agentActionCalls, 1, "valid integrations action must call service once");
let commandPathWrites = 0;
assert.throws(() => handleControlCenterUpdateAgentSetupCommandPathsRequest({ id: 2 }, authorizedSender, { claude: "claude" }, () => { commandPathWrites += 1; return { claude: "", node: "", opencode: "" }; }), /unauthorized sender/);
assert.throws(() => handleControlCenterUpdateAgentSetupCommandPathsRequest(authorizedSender, authorizedSender, [], () => { commandPathWrites += 1; return { claude: "", node: "", opencode: "" }; }), /plain object/);
assert.equal(commandPathWrites, 0, "unauthorized/non-plain command paths must not write");
const savedPaths = handleControlCenterUpdateAgentSetupCommandPathsRequest(authorizedSender, authorizedSender, { claude: "claude" }, (patch) => { commandPathWrites += 1; assert.deepEqual(patch, { claude: "claude" }); return { claude: "claude", node: "", opencode: "" }; });
assert.equal(commandPathWrites, 1);
assert.equal(savedPaths.claude, "claude");

const pluginSnapshot = { plugins: [{ id: "plugin.ok-1", version: "1.0.0", source: "catalog", enabled: false, approvedPermissions: [] }] } as const;
const pluginResult = { ok: true, snapshot: pluginSnapshot } as const;
let pluginCalls = 0;
await assert.rejects(() => handleControlCenterGetPluginsSnapshotRequest({ id: 2 }, authorizedSender, async () => { pluginCalls += 1; return pluginSnapshot; }), /unauthorized sender/);
assert.equal(pluginCalls, 0, "unauthorized plugin snapshot must not call service");
assert.equal(await handleControlCenterGetPluginsSnapshotRequest(authorizedSender, authorizedSender, async () => { pluginCalls += 1; return pluginSnapshot; }), pluginSnapshot);
assert.equal(pluginCalls, 1, "valid plugin snapshot calls exact service");
await assert.rejects(() => handleControlCenterPluginEnabledRequest({ id: 2 }, authorizedSender, "plugin.ok-1", true, async () => { pluginCalls += 1; return pluginResult; }), /unauthorized sender/);
await assert.rejects(() => handleControlCenterPluginEnabledRequest(authorizedSender, authorizedSender, "../plugin", true, async () => { pluginCalls += 1; return pluginResult; }), /invalid plugin id/);
await assert.rejects(() => handleControlCenterPluginEnabledRequest(authorizedSender, authorizedSender, "plugin.ok-1", "true", async () => { pluginCalls += 1; return pluginResult; }), /expected boolean/);
assert.equal(pluginCalls, 1, "invalid plugin enabled requests must not call service");
await handleControlCenterPluginEnabledRequest(authorizedSender, authorizedSender, "plugin.ok-1", true, async (id, enabled) => { pluginCalls += 1; assert.equal(id, "plugin.ok-1"); assert.equal(enabled, true); return pluginResult; });
await assert.rejects(() => handleControlCenterPluginConfigRequest({ id: 2 }, authorizedSender, "plugin.ok-1", { safe: true }, async () => { pluginCalls += 1; return pluginResult; }), /unauthorized sender/);
await assert.rejects(() => handleControlCenterPluginConfigRequest(authorizedSender, authorizedSender, "../plugin", { safe: true }, async () => { pluginCalls += 1; return pluginResult; }), /invalid plugin id/);
await handleControlCenterPluginConfigRequest(authorizedSender, authorizedSender, "plugin.ok-1", { safe: true }, async (id, config) => { pluginCalls += 1; assert.equal(id, "plugin.ok-1"); assert.deepEqual(config, { safe: true }); return pluginResult; });
await assert.rejects(() => handleControlCenterPluginCommandRequest(authorizedSender, authorizedSender, "plugin.ok-1", "../command", async () => { pluginCalls += 1; return pluginResult; }), /invalid plugin command id/);
await handleControlCenterPluginCommandRequest(authorizedSender, authorizedSender, "plugin.ok-1", "command.ok:1", async (id, commandId) => { pluginCalls += 1; assert.equal(id, "plugin.ok-1"); assert.equal(commandId, "command.ok:1"); return pluginResult; });
for (const mutate of [handleControlCenterPluginIdMutationRequest]) {
  await assert.rejects(() => mutate({ id: 2 }, authorizedSender, "plugin.ok-1", async () => { pluginCalls += 1; return pluginResult; }), /unauthorized sender/);
  await assert.rejects(() => mutate(authorizedSender, authorizedSender, "../plugin", async () => { pluginCalls += 1; return pluginResult; }), /invalid plugin id/);
  await mutate(authorizedSender, authorizedSender, "plugin.ok-1", async (id) => { pluginCalls += 1; assert.equal(id, "plugin.ok-1"); return pluginResult; });
}
await assert.rejects(() => handleControlCenterLoadLocalPluginRequest({ id: 2 }, authorizedSender, async () => { pluginCalls += 1; return pluginResult; }), /unauthorized sender/);
await handleControlCenterLoadLocalPluginRequest(authorizedSender, authorizedSender, async () => { pluginCalls += 1; return pluginResult; });
await assert.rejects(() => handleControlCenterGetPluginCatalogSnapshotRequest({ id: 2 }, authorizedSender, true, async () => { pluginCalls += 1; return { plugins: [] }; }), /unauthorized sender/);
await assert.rejects(() => handleControlCenterGetPluginCatalogSnapshotRequest(authorizedSender, authorizedSender, "true", async () => { pluginCalls += 1; return { plugins: [] }; }), /boolean or undefined/);
assert.deepEqual(await handleControlCenterGetPluginCatalogSnapshotRequest(authorizedSender, authorizedSender, true, async (refresh) => { pluginCalls += 1; assert.equal(refresh, true); return { plugins: [] }; }), { plugins: [] });

for (const action of ["setDefaultPet", "installCatalogPet", "importCodexPet", "removeInstalledPet"] as const) {
  const calls: string[] = [];
  let petTrayRefreshes = 0;
  const result = await mutateControlCenterPet(`${action}-pet`, {
    writePet: async (petId) => { calls.push(petId); return { ...deps.state, preferences: { ...deps.state.preferences, defaultPetId: petId }, pets: { installed: [{ id: petId, displayName: action, builtIn: false, protected: false, installed: true }] } }; },
    refreshTrayMenu: () => { petTrayRefreshes += 1; },
  });
  assert.deepEqual(calls, [`${action}-pet`], `${action} must call exact pet service once`);
  assert.equal(petTrayRefreshes, 1, `${action} must refresh tray once after success`);
  assert.equal(result.pets.defaultPetId, `${action}-pet`, `${action} must return fresh sanitized pets snapshot`);
}

const setDefaultSideEffects: string[] = [];
const setDefaultResult = await handleControlCenterPetMutationRequest(authorizedSender, authorizedSender, "next-default", {
  writePet: async (petId) => { setDefaultSideEffects.push(`write:${petId}`); return { ...deps.state, preferences: { ...deps.state.preferences, defaultPetId: petId } }; },
  refreshDefaultPetContent: () => { setDefaultSideEffects.push("refresh-default"); },
  recoverDefaultPetMouseInterop: (reason) => { setDefaultSideEffects.push(`recover:${reason}`); },
  scheduleDelayedRecoverDefaultPetMouseInterop: (reason, delayMs) => { setDefaultSideEffects.push(`schedule:${reason}:${delayMs}`); },
  refreshTrayMenu: () => { setDefaultSideEffects.push("refresh-tray"); },
}, { allowBuiltIn: true });
assert.deepEqual(setDefaultSideEffects, ["write:next-default", "refresh-default", "recover:default-pet-changed", "schedule:default-pet-changed+500ms:500", "refresh-tray"], "authorized setDefaultPet success must refresh/recover default pet and tray after write");
assert.equal(setDefaultResult.pets.defaultPetId, "next-default");

const removePetSideEffects: string[] = [];
await handleControlCenterPetMutationRequest(authorizedSender, authorizedSender, "remove-me", {
  writePet: async (petId) => { removePetSideEffects.push(`write:${petId}`); return deps.state; },
  refreshDefaultPetContent: () => { removePetSideEffects.push("refresh-default"); },
  refreshTrayMenu: () => { removePetSideEffects.push("refresh-tray"); },
});
assert.deepEqual(removePetSideEffects, ["write:remove-me", "refresh-default", "refresh-tray"], "authorized removeInstalledPet success must refresh default pet and tray after write");

for (const [label, sender, petId, writePet, allowBuiltIn, expectedError] of [
  ["unauthorized", { id: 2 }, "safe-pet", async () => deps.state, false, /unauthorized sender/],
  ["invalid", authorizedSender, "../pet", async () => deps.state, false, /invalid pet id/],
  ["service-failure", authorizedSender, "safe-pet", async () => { throw new Error("service failed"); }, false, /service failed/],
] as const) {
  const blockedSideEffects: string[] = [];
  await assert.rejects(() => handleControlCenterPetMutationRequest(sender, authorizedSender, petId, {
    writePet,
    refreshDefaultPetContent: () => { blockedSideEffects.push("refresh-default"); },
    recoverDefaultPetMouseInterop: (reason) => { blockedSideEffects.push(`recover:${reason}`); },
    scheduleDelayedRecoverDefaultPetMouseInterop: (reason, delayMs) => { blockedSideEffects.push(`schedule:${reason}:${delayMs}`); },
    refreshTrayMenu: () => { blockedSideEffects.push("refresh-tray"); },
  }, { allowBuiltIn }), expectedError, `${label} pet mutation must reject`);
  assert.deepEqual(blockedSideEffects, [], `${label} pet mutation must not refresh tray/default pet or recover mouse interop`);
}

let handledMutationCalls = 0;
let handledMutationTrayRefreshes = 0;
const handledMutation = await handleControlCenterPetMutationRequest(authorizedSender, authorizedSender, "valid-pet", {
  writePet: async (petId) => { handledMutationCalls += 1; return { ...deps.state, preferences: { ...deps.state.preferences, defaultPetId: petId } }; },
  refreshTrayMenu: () => { handledMutationTrayRefreshes += 1; },
});
assert.equal(handledMutationCalls, 1, "authorized valid pet mutation must call service once");
assert.equal(handledMutationTrayRefreshes, 1, "authorized valid pet mutation must refresh tray once");
assert.equal(handledMutation.pets.defaultPetId, "valid-pet");

for (const [sender, petId, allowBuiltIn] of [[{ id: 2 }, "valid-pet", false], [authorizedSender, "../pet", false], [authorizedSender, "builtin", false]] as const) {
  let sideEffects = 0;
  await assert.rejects(() => handleControlCenterPetMutationRequest(sender, authorizedSender, petId, {
    writePet: async () => { sideEffects += 1; return deps.state; },
    refreshTrayMenu: () => { sideEffects += 1; },
  }, { allowBuiltIn }), sender === authorizedSender ? /invalid pet id/ : /unauthorized sender/);
  assert.equal(sideEffects, 0, "unauthorized or invalid pet mutation must not call service or tray dependencies");
}

let builtInSetDefaultCalls = 0;
await handleControlCenterPetMutationRequest(authorizedSender, authorizedSender, "builtin", {
  writePet: async (petId) => { builtInSetDefaultCalls += 1; return { ...deps.state, preferences: { ...deps.state.preferences, defaultPetId: petId } }; },
  refreshTrayMenu: () => undefined,
}, { allowBuiltIn: true });
assert.equal(builtInSetDefaultCalls, 1, "set default may accept built-in pet id");

let catalogReads = 0;
const catalogSnapshot = await handleControlCenterGetPetCatalogSnapshotRequest(authorizedSender, authorizedSender, async () => { catalogReads += 1; return { source: "remote", pets: [{ id: "pet", displayName: "Pet", description: "Desc", preview: "https://openpets.dev/pets/pet.webp", zip: "https://zip.openpets.dev/pets/pet.zip" }], page: 0, pageCount: 2 }; });
assert.equal(catalogReads, 1);
assert.equal(catalogSnapshot.pets[0]?.preview, "https://openpets.dev/pets/pet.webp");
let unauthorizedCatalogReads = 0;
await assert.rejects(() => handleControlCenterGetPetCatalogSnapshotRequest({ id: 2 }, authorizedSender, async () => { unauthorizedCatalogReads += 1; return { source: "remote", pets: [] }; }), /unauthorized sender/);
assert.equal(unauthorizedCatalogReads, 0, "unauthorized catalog snapshot must not call catalog dependency");
let pageReads = 0;
await assert.rejects(() => handleControlCenterGetPetCatalogPageRequest(authorizedSender, authorizedSender, -1, async () => { pageReads += 1; return { source: "remote", pets: [] }; }), /invalid catalog page/);
assert.equal(pageReads, 0, "invalid catalog page must not call page dependency");
await assert.rejects(() => handleControlCenterGetPetCatalogPageRequest(authorizedSender, authorizedSender, CONTROL_CENTER_MAX_CATALOG_PAGE + 1, async () => { pageReads += 1; return { source: "remote", pets: [] }; }), /invalid catalog page/);
assert.equal(pageReads, 0, "too-large catalog page must not call page dependency");
const pageSnapshot = await handleControlCenterGetPetCatalogPageRequest(authorizedSender, authorizedSender, 1, async (page) => { pageReads += 1; return { source: "remote", pets: [], page, pageCount: 2 }; });
assert.equal(pageSnapshot.page, 1);
let searchReads = 0;
const searchSnapshot = await handleControlCenterGetPetCatalogSearchRequest(authorizedSender, authorizedSender, async () => { searchReads += 1; return { source: "remote", total: 1, pets: [{ id: "pet", displayName: "Pet", searchText: "pet desc", category: "western", catalogPage: 0 }] }; });
assert.equal(searchReads, 1);
assert.equal(searchSnapshot.pets[0]?.catalogPage, 0);
let codexReads = 0;
const codexSnapshot = await handleControlCenterGetCodexPetsSnapshotRequest(authorizedSender, authorizedSender, async () => { codexReads += 1; return { source: "codex", pets: [{ id: "codex", displayName: "Codex", description: "Local", preview: "data:image/webp;base64,AA", spritesheet: "openpets-codex://spritesheet/codex" }] }; });
assert.equal(codexReads, 1);
assert.equal(codexSnapshot.pets[0]?.spritesheet, "openpets-codex://spritesheet/codex");

const refreshedSettings = buildControlCenterSettingsSnapshot({ ...deps, launchAtLogin: { supported: true, enabled: true } });
const setterCalls: LoginItemSetterSettings[] = [];
const unsupportedResult = setControlCenterLaunchAtLogin(true, {
  isSupported: () => false,
  setLoginItemSettings: (settings: LoginItemSetterSettings) => setterCalls.push(settings),
  getSettingsSnapshot: () => refreshedSettings,
});
assert.deepEqual(setterCalls, [], "unsupported launch-at-login must not call setter");
assert.equal(unsupportedResult.settings, refreshedSettings, "unsupported launch-at-login must return refreshed settings snapshot");

const supportedSetterCalls: LoginItemSetterSettings[] = [];
const supportedResult = setControlCenterLaunchAtLogin(false, {
  isSupported: () => true,
  setLoginItemSettings: (settings: LoginItemSetterSettings) => supportedSetterCalls.push(settings),
  getSettingsSnapshot: () => refreshedSettings,
});
assert.deepEqual(supportedSetterCalls, [{ openAtLogin: false, openAsHidden: true }], "supported launch-at-login must call setter once with legacy settings shape");
assert.equal(supportedResult.settings, refreshedSettings, "supported launch-at-login must return refreshed settings snapshot");

const unauthorizedSetterCalls: LoginItemSetterSettings[] = [];
assert.throws(() => handleControlCenterSetLaunchAtLoginRequest({ id: 2 }, authorizedSender, true, {
  isSupported: () => true,
  setLoginItemSettings: (settings: LoginItemSetterSettings) => unauthorizedSetterCalls.push(settings),
  getSettingsSnapshot: () => refreshedSettings,
}), /unauthorized sender/);
assert.deepEqual(unauthorizedSetterCalls, [], "unauthorized sender must not reach launch-at-login setter/write path");

const invalidInputSetterCalls: LoginItemSetterSettings[] = [];
assert.throws(() => handleControlCenterSetLaunchAtLoginRequest(authorizedSender, authorizedSender, "true", {
  isSupported: () => true,
  setLoginItemSettings: (settings: LoginItemSetterSettings) => invalidInputSetterCalls.push(settings),
  getSettingsSnapshot: () => refreshedSettings,
}), /expected boolean/);
assert.deepEqual(invalidInputSetterCalls, [], "invalid input must not reach launch-at-login setter/write path");

const petScaleWriteCalls: { readonly petScale: number }[] = [];
let defaultRefreshCalls = 0;
let agentRefreshCalls = 0;
const petScaleResult = setControlCenterPetScale(0.44, {
  petScaleOptions: deps.petScaleOptions,
  updatePreferences: (patch) => petScaleWriteCalls.push(patch),
  refreshDefaultPetContent: () => { defaultRefreshCalls += 1; },
  refreshAgentPetContent: () => { agentRefreshCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
});
assert.deepEqual(petScaleWriteCalls, [{ petScale: 0.44 }], "valid pet scale must write legacy petScale preference patch");
assert.equal(defaultRefreshCalls, 1, "valid pet scale must refresh default pet content once");
assert.equal(agentRefreshCalls, 1, "valid pet scale must refresh agent pet content once");
assert.equal(petScaleResult.settings, refreshedSettings, "valid pet scale must return refreshed settings snapshot");

const invalidPetScaleWriteCalls: { readonly petScale: number }[] = [];
let invalidPetScaleRefreshCalls = 0;
assert.throws(() => handleControlCenterSetPetScaleRequest(authorizedSender, authorizedSender, 0.5, {
  petScaleOptions: deps.petScaleOptions,
  updatePreferences: (patch) => invalidPetScaleWriteCalls.push(patch),
  refreshDefaultPetContent: () => { invalidPetScaleRefreshCalls += 1; },
  refreshAgentPetContent: () => { invalidPetScaleRefreshCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
}), /supported pet scale option/);
assert.deepEqual(invalidPetScaleWriteCalls, [], "invalid pet scale must not write preferences");
assert.equal(invalidPetScaleRefreshCalls, 0, "invalid pet scale must not refresh pet content");

const unauthorizedPetScaleWriteCalls: { readonly petScale: number }[] = [];
let unauthorizedPetScaleRefreshCalls = 0;
assert.throws(() => handleControlCenterSetPetScaleRequest({ id: 2 }, authorizedSender, 0.56, {
  petScaleOptions: deps.petScaleOptions,
  updatePreferences: (patch) => unauthorizedPetScaleWriteCalls.push(patch),
  refreshDefaultPetContent: () => { unauthorizedPetScaleRefreshCalls += 1; },
  refreshAgentPetContent: () => { unauthorizedPetScaleRefreshCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
}), /unauthorized sender/);
assert.deepEqual(unauthorizedPetScaleWriteCalls, [], "unauthorized pet scale sender must not write preferences");
assert.equal(unauthorizedPetScaleRefreshCalls, 0, "unauthorized pet scale sender must not refresh pet content");

let resetDefaultPetPositionCalls = 0;
const resetResult = resetControlCenterDefaultPetPosition({
  resetDefaultPetToInitialPosition: () => { resetDefaultPetPositionCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
});
assert.equal(resetDefaultPetPositionCalls, 1, "authorized default pet position reset must invoke legacy reset once");
assert.equal(resetResult.settings, refreshedSettings, "default pet position reset must return refreshed settings snapshot");

let updateCheckCalls = 0;
let trayRefreshCalls = 0;
const updateCheckResult = await handleControlCenterCheckForUpdatesRequest(authorizedSender, authorizedSender, {
  checkForGitHubReleaseUpdate: async () => { updateCheckCalls += 1; },
  refreshTrayMenu: () => { trayRefreshCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
});
assert.equal(updateCheckCalls, 1, "authorized update check must invoke GitHub check once");
assert.equal(trayRefreshCalls, 1, "authorized update check must refresh tray menu once");
assert.equal(updateCheckResult.settings, refreshedSettings, "authorized update check must return refreshed settings snapshot");

let unauthorizedUpdateCheckCalls = 0;
let unauthorizedTrayRefreshCalls = 0;
await assert.rejects(() => handleControlCenterCheckForUpdatesRequest({ id: 2 }, authorizedSender, {
  checkForGitHubReleaseUpdate: async () => { unauthorizedUpdateCheckCalls += 1; },
  refreshTrayMenu: () => { unauthorizedTrayRefreshCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
}), /unauthorized sender/);
assert.equal(unauthorizedUpdateCheckCalls, 0, "unauthorized update check must not invoke GitHub check");
assert.equal(unauthorizedTrayRefreshCalls, 0, "unauthorized update check must not refresh tray menu");

let openReleaseCalls = 0;
let openReleaseStatusReads = 0;
await handleControlCenterOpenUpdateReleasePageRequest(authorizedSender, authorizedSender, {
  getUpdateStatus: () => { openReleaseStatusReads += 1; return { state: "available", currentVersion: "2.1.1", latestVersion: "2.2.0" }; },
  openUpdateReleasePage: async () => { openReleaseCalls += 1; },
});
assert.equal(openReleaseStatusReads, 1, "authorized open release must read update status once");
assert.equal(openReleaseCalls, 1, "authorized open release must invoke opener once");

for (const state of ["current", "idle"] as const) {
  let nonAvailableStatusReads = 0;
  let nonAvailableOpenReleaseCalls = 0;
  await assert.rejects(() => handleControlCenterOpenUpdateReleasePageRequest(authorizedSender, authorizedSender, {
    getUpdateStatus: () => { nonAvailableStatusReads += 1; return { state, currentVersion: "2.1.1" }; },
    openUpdateReleasePage: async () => { nonAvailableOpenReleaseCalls += 1; },
  }), /expected available/);
  assert.equal(nonAvailableStatusReads, 1, `authorized ${state} open release must read update status once`);
  assert.equal(nonAvailableOpenReleaseCalls, 0, `authorized ${state} open release must not invoke opener`);
}

let unauthorizedOpenReleaseCalls = 0;
let unauthorizedOpenReleaseStatusReads = 0;
await assert.rejects(() => handleControlCenterOpenUpdateReleasePageRequest({ id: 2 }, authorizedSender, {
  getUpdateStatus: () => { unauthorizedOpenReleaseStatusReads += 1; return { state: "available", currentVersion: "2.1.1", latestVersion: "2.2.0" }; },
  openUpdateReleasePage: async () => { unauthorizedOpenReleaseCalls += 1; },
}), /unauthorized sender/);
assert.equal(unauthorizedOpenReleaseStatusReads, 0, "unauthorized open release must not read update status");
assert.equal(unauthorizedOpenReleaseCalls, 0, "unauthorized open release must not invoke opener");

let unauthorizedResetDefaultPetPositionCalls = 0;
assert.throws(() => handleControlCenterResetDefaultPetPositionRequest({ id: 2 }, authorizedSender, {
  resetDefaultPetToInitialPosition: () => { unauthorizedResetDefaultPetPositionCalls += 1; },
  getSettingsSnapshot: () => refreshedSettings,
}), /unauthorized sender/);
assert.equal(unauthorizedResetDefaultPetPositionCalls, 0, "unauthorized default pet position reset must not invoke legacy reset");

function reactionMutationDeps(stateOverrides: Record<string, string | undefined>): { deps: ControlCenterReactionMappingMutationDependencies; writes: { readonly reactionAnimationOverrides: unknown }[]; refreshes: () => number } {
  const writes: { readonly reactionAnimationOverrides: unknown }[] = [];
  let refreshes = 0;
  const mutationState = { ...deps.state, preferences: { ...deps.state.preferences, reactionAnimationOverrides: stateOverrides } } as ControlCenterSnapshotDependencies["state"];
  let currentState = mutationState;
  return {
    writes,
    refreshes: () => refreshes,
    deps: {
      state: mutationState,
      reactionAnimationMetadata: deps.reactionAnimationMetadata,
      selectableAnimationMetadata: deps.selectableAnimationMetadata,
      updatePreferences: (patch) => {
        writes.push(patch);
        currentState = { ...currentState, preferences: { ...currentState.preferences, reactionAnimationOverrides: patch.reactionAnimationOverrides } } as ControlCenterSnapshotDependencies["state"];
      },
      refreshDefaultPetContent: () => { refreshes += 1; },
      refreshAgentPetContent: () => { refreshes += 1; },
      getSettingsSnapshot: () => refreshedSettings,
      getReactionMappingSnapshot: () => buildControlCenterReactionMappingSnapshot({ ...deps, state: currentState }),
    },
  };
}

let mutation = reactionMutationDeps({ success: "jumping" });
assert.equal(setControlCenterReactionAnimationOverride("error", "failed", mutation.deps).settings, refreshedSettings);
assert.deepEqual(mutation.writes, [{ reactionAnimationOverrides: undefined }], "setting default animation must normalize away default-equivalent overrides");
assert.equal(mutation.refreshes(), 2, "valid reaction set must refresh both pet contents");

mutation = reactionMutationDeps({ success: "failed" });
const setOverrideResult = setControlCenterReactionAnimationOverride("error", "review", mutation.deps);
assert.deepEqual(mutation.writes, [{ reactionAnimationOverrides: { success: "failed", error: "review" } }], "valid reaction set must write normalized override patch");
assert.deepEqual(setOverrideResult.reactionMapping.overrides, [{ reactionId: "success", animationId: "failed" }, { reactionId: "error", animationId: "review" }], "valid reaction set result must include fresh normalized post-write overrides");
assert.equal(setOverrideResult.reactionMapping.reactions.find((reaction) => reaction.id === "error")?.currentAnimation, "review", "valid reaction set result must reflect post-write current animation");
assert.equal(setOverrideResult.reactionMapping.spriteMetadata.previewUrl, authorizedReactionSnapshot.spriteMetadata.previewUrl, "reaction mutation result must preserve scoped preview URL");
assert.equal(setOverrideResult.reactionMapping.spriteMetadata.version, authorizedReactionSnapshot.spriteMetadata.version, "reaction mutation result must preserve preview version");

mutation = reactionMutationDeps({ success: "failed", error: "review" });
const resetOneResult = resetControlCenterReactionAnimationOverride("success", mutation.deps);
assert.deepEqual(mutation.writes, [{ reactionAnimationOverrides: { error: "review" } }], "per-row reset must remove only that reaction");
assert.deepEqual(resetOneResult.reactionMapping.overrides, [{ reactionId: "error", animationId: "review" }], "per-row reset result must include fresh normalized post-write overrides");

mutation = reactionMutationDeps({ success: "failed", error: "review" });
const resetAllResult = resetControlCenterReactionAnimationOverrides(mutation.deps);
assert.deepEqual(mutation.writes, [{ reactionAnimationOverrides: undefined }], "reset all must clear all overrides");
assert.deepEqual(resetAllResult.reactionMapping.overrides, [], "reset-all result must include fresh normalized empty post-write overrides");

mutation = reactionMutationDeps({});
assert.throws(() => handleControlCenterSetReactionAnimationOverrideRequest(authorizedSender, authorizedSender, "not-reaction", "review", mutation.deps), /invalid reaction id/);
assert.deepEqual(mutation.writes, [], "invalid reaction must not write");
assert.equal(mutation.refreshes(), 0, "invalid reaction must not refresh");

mutation = reactionMutationDeps({});
assert.throws(() => handleControlCenterSetReactionAnimationOverrideRequest(authorizedSender, authorizedSender, "error", "file:///bad", mutation.deps), /invalid animation id/);
assert.deepEqual(mutation.writes, [], "invalid animation must not write");
assert.equal(mutation.refreshes(), 0, "invalid animation must not refresh");

mutation = reactionMutationDeps({});
assert.throws(() => handleControlCenterSetReactionAnimationOverrideRequest({ id: 2 }, authorizedSender, "error", "review", mutation.deps), /unauthorized sender/);
assert.deepEqual(mutation.writes, [], "unauthorized reaction mapping sender must not write");
assert.equal(mutation.refreshes(), 0, "unauthorized reaction mapping sender must not refresh");

console.error("Control Center IPC behavior passed.");
