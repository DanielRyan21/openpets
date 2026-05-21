import type { InstalledPetState, OpenPetsStateV1 } from "./app-state.js";
import type { AgentSetupAction, AgentSetupCommandPaths, AgentSetupSnapshot } from "./agent-setup.js";
import type { CatalogSearchUiState, CatalogUiState } from "./catalog.js";
import type { CodexPetUiState } from "./codex-pets.js";
import type { PluginCatalogSnapshot, PluginServiceResult, PluginServiceSnapshot } from "./plugin-service.js";
import { validateReactionAnimationOverrides } from "./reaction-animation-mapping.js";
import type { ControlCenterCodexPetsSnapshot, ControlCenterDashboardSnapshot, ControlCenterOnboardingSnapshot, ControlCenterPetCatalogSearchSnapshot, ControlCenterPetCatalogSnapshot, ControlCenterPetMutationResult, ControlCenterPetsSnapshot, ControlCenterReactionMappingMutationResult, ControlCenterReactionMappingSnapshot, ControlCenterResetDefaultPetPositionResult, ControlCenterSetLaunchAtLoginResult, ControlCenterSetPetScaleResult, ControlCenterSettingsSnapshot, ControlCenterUpdateStatusSnapshot } from "./shared/control-center-contract.js";

interface UpdateStatusLike extends ControlCenterUpdateStatusSnapshot {}

export const CONTROL_CENTER_MAX_CATALOG_PAGE = 10_000;

export interface ControlCenterSnapshotDependencies {
  readonly appVersion: string;
  readonly state: OpenPetsStateV1;
  readonly updateStatus: UpdateStatusLike;
  readonly launchAtLogin: { readonly supported: boolean; readonly enabled: boolean };
  readonly petScaleOptions: readonly { readonly value: number; readonly label: string }[];
  readonly reactionAnimationMetadata: readonly { readonly id: string; readonly label: string; readonly description: string; readonly defaultAnimation: string }[];
  readonly selectableAnimationMetadata: readonly { readonly id: string; readonly label: string; readonly description: string }[];
  readonly defaultPetSprite: {
    readonly previewUrl?: string;
    readonly version?: string;
    readonly fileName: string;
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly columns: number;
    readonly rows: number;
    readonly states: Readonly<Record<string, { readonly row: number; readonly frames: number; readonly durationMs: number; readonly iterations?: number | "infinite" }>>;
  };
}

export interface ControlCenterReactionMappingMutationDependencies {
  readonly state: OpenPetsStateV1;
  readonly reactionAnimationMetadata: ControlCenterSnapshotDependencies["reactionAnimationMetadata"];
  readonly selectableAnimationMetadata: ControlCenterSnapshotDependencies["selectableAnimationMetadata"];
  readonly updatePreferences: (patch: { readonly reactionAnimationOverrides: ReturnType<typeof validateReactionAnimationOverrides> }) => void;
  readonly refreshDefaultPetContent: () => void;
  readonly refreshAgentPetContent: () => void;
  readonly getSettingsSnapshot: () => ControlCenterSettingsSnapshot;
  readonly getReactionMappingSnapshot: () => ControlCenterReactionMappingSnapshot;
}

export interface ControlCenterSetLaunchAtLoginDependencies {
  readonly isSupported: () => boolean;
  readonly setLoginItemSettings: (settings: { readonly openAtLogin: boolean; readonly openAsHidden: true }) => void;
  readonly getSettingsSnapshot: () => ControlCenterSettingsSnapshot;
}

export interface ControlCenterSetPetScaleDependencies {
  readonly petScaleOptions: readonly { readonly value: number; readonly label: string }[];
  readonly updatePreferences: (patch: { readonly petScale: number }) => void;
  readonly refreshDefaultPetContent: () => void;
  readonly refreshAgentPetContent: () => void;
  readonly getSettingsSnapshot: () => ControlCenterSettingsSnapshot;
}

export interface ControlCenterResetDefaultPetPositionDependencies {
  readonly resetDefaultPetToInitialPosition: () => void;
  readonly getSettingsSnapshot: () => ControlCenterSettingsSnapshot;
}

export interface ControlCenterCheckForUpdatesDependencies {
  readonly checkForGitHubReleaseUpdate: () => Promise<unknown>;
  readonly refreshTrayMenu: () => void | Promise<void>;
  readonly getSettingsSnapshot: () => ControlCenterSettingsSnapshot;
}

export interface ControlCenterOpenUpdateReleasePageDependencies {
  readonly getUpdateStatus: () => UpdateStatusLike;
  readonly openUpdateReleasePage: () => Promise<void>;
}

export interface ControlCenterPetMutationDependencies {
  readonly writePet: (petId: string) => Promise<OpenPetsStateV1>;
  readonly refreshDefaultPetContent?: () => void;
  readonly recoverDefaultPetMouseInterop?: (reason: string) => void;
  readonly scheduleDelayedRecoverDefaultPetMouseInterop?: (reason: string, delayMs: number) => void;
  readonly refreshTrayMenu: () => void | Promise<void>;
}

const CONTROL_CENTER_SAFE_PLUGIN_ID = /^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/;
const CONTROL_CENTER_SAFE_PLUGIN_COMMAND_ID = /^[A-Za-z0-9._:-]{1,64}$/;

export function assertControlCenterSafePluginId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !CONTROL_CENTER_SAFE_PLUGIN_ID.test(value)) throw new Error("Control Center IPC invalid plugin id.");
}

export function assertControlCenterSafePluginCommandId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !CONTROL_CENTER_SAFE_PLUGIN_COMMAND_ID.test(value)) throw new Error("Control Center IPC invalid plugin command id.");
}

export function assertControlCenterOptionalBooleanInput(value: unknown, label: string): asserts value is boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") throw new Error(`Control Center IPC invalid ${label}: expected boolean or undefined.`);
}

export async function handleControlCenterGetPluginsSnapshotRequest(sender: unknown, controlCenterSender: unknown, getSnapshot: () => Promise<PluginServiceSnapshot>): Promise<PluginServiceSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return getSnapshot();
}

export async function handleControlCenterPluginEnabledRequest(sender: unknown, controlCenterSender: unknown, id: unknown, enabled: unknown, setEnabled: (id: string, enabled: boolean) => Promise<PluginServiceResult>): Promise<PluginServiceResult> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterSafePluginId(id);
  assertControlCenterBooleanInput(enabled, "plugin.enabled");
  return setEnabled(id, enabled);
}

export async function handleControlCenterPluginConfigRequest(sender: unknown, controlCenterSender: unknown, id: unknown, config: unknown, saveConfig: (id: string, config: unknown) => Promise<PluginServiceResult>): Promise<PluginServiceResult> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterSafePluginId(id);
  return saveConfig(id, config);
}

export async function handleControlCenterPluginIdMutationRequest(sender: unknown, controlCenterSender: unknown, id: unknown, mutate: (id: string) => Promise<PluginServiceResult>): Promise<PluginServiceResult> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterSafePluginId(id);
  return mutate(id);
}

export async function handleControlCenterPluginCommandRequest(sender: unknown, controlCenterSender: unknown, id: unknown, commandId: unknown, execute: (id: string, commandId: string) => Promise<PluginServiceResult>): Promise<PluginServiceResult> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterSafePluginId(id);
  assertControlCenterSafePluginCommandId(commandId);
  return execute(id, commandId);
}

export async function handleControlCenterLoadLocalPluginRequest(sender: unknown, controlCenterSender: unknown, loadLocal: () => Promise<PluginServiceResult>): Promise<PluginServiceResult> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return loadLocal();
}

export async function handleControlCenterGetPluginCatalogSnapshotRequest(sender: unknown, controlCenterSender: unknown, refresh: unknown, getCatalog: (refresh?: boolean) => Promise<PluginCatalogSnapshot>): Promise<PluginCatalogSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterOptionalBooleanInput(refresh, "pluginCatalog.refresh");
  return getCatalog(refresh);
}

export const CONTROL_CENTER_AGENT_SETUP_ACTIONS = ["configure", "replace", "remove", "install-memory", "doctor-hooks", "install-hooks", "uninstall-hooks", "opencode-install", "opencode-remove", "cursor-install", "cursor-replace", "cursor-remove"] as const;

export function assertControlCenterAgentSetupAction(value: unknown): asserts value is AgentSetupAction {
  if (typeof value !== "string" || !(CONTROL_CENTER_AGENT_SETUP_ACTIONS as readonly string[]).includes(value)) throw new Error("Control Center IPC invalid agent setup action.");
}

export function assertControlCenterAgentSetupCommandMode(value: unknown): asserts value is "published" | "local" | "bundled" | undefined {
  if (value !== undefined && value !== "published" && value !== "local" && value !== "bundled") throw new Error("Control Center IPC invalid agent setup command mode.");
}

export function assertControlCenterPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`Control Center IPC invalid ${label}: expected plain object.`);
}

export async function handleControlCenterGetAgentSetupSnapshotRequest(sender: unknown, controlCenterSender: unknown, selectedPetId: unknown, commandMode: unknown, getSnapshot: (selectedPetId?: unknown, commandMode?: unknown) => Promise<AgentSetupSnapshot>): Promise<AgentSetupSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterAgentSetupCommandMode(commandMode);
  return getSnapshot(selectedPetId, commandMode);
}

export async function handleControlCenterRunAgentSetupActionRequest(sender: unknown, controlCenterSender: unknown, action: unknown, selectedPetId: unknown, commandMode: unknown, runAction: (action: AgentSetupAction, selectedPetId?: unknown, commandMode?: unknown) => Promise<AgentSetupSnapshot>): Promise<AgentSetupSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterAgentSetupAction(action);
  assertControlCenterAgentSetupCommandMode(commandMode);
  return runAction(action, selectedPetId, commandMode);
}

export function handleControlCenterUpdateAgentSetupCommandPathsRequest(sender: unknown, controlCenterSender: unknown, patch: unknown, updatePaths: (patch: unknown) => AgentSetupCommandPaths): AgentSetupCommandPaths {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterPlainObject(patch, "agent setup command paths");
  return updatePaths(patch);
}

export function assertAuthorizedControlCenterSender(sender: unknown, controlCenterSender: unknown): void {
  if (!controlCenterSender || sender !== controlCenterSender) {
    throw new Error("Control Center IPC denied for unauthorized sender.");
  }
}

export function assertControlCenterBooleanInput(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Control Center IPC invalid ${label}: expected boolean.`);
  }
}

export function assertControlCenterPetScaleInput(value: unknown, options: readonly { readonly value: number }[]): asserts value is number {
  if (typeof value !== "number" || !options.some((option) => option.value === value)) {
    throw new Error("Control Center IPC invalid petScale.value: expected supported pet scale option.");
  }
}

export function assertControlCenterCatalogPageInput(value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > CONTROL_CENTER_MAX_CATALOG_PAGE) {
    throw new Error(`Control Center IPC invalid catalog page: expected integer between 0 and ${CONTROL_CENTER_MAX_CATALOG_PAGE}.`);
  }
}

export function assertControlCenterSafePetId(value: unknown, options: { readonly allowBuiltIn: boolean } = { allowBuiltIn: false }): asserts value is string {
  if (typeof value !== "string" || (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(value)) || (!options.allowBuiltIn && value === "builtin")) {
    throw new Error("Control Center IPC invalid pet id: expected safe pet id.");
  }
}

export async function mutateControlCenterPet(petId: string, deps: ControlCenterPetMutationDependencies): Promise<ControlCenterPetMutationResult> {
  const state = await deps.writePet(petId);
  deps.refreshDefaultPetContent?.();
  if (deps.recoverDefaultPetMouseInterop) {
    deps.recoverDefaultPetMouseInterop("default-pet-changed");
    deps.scheduleDelayedRecoverDefaultPetMouseInterop?.("default-pet-changed+500ms", 500);
  }
  await deps.refreshTrayMenu();
  return { pets: buildControlCenterPetsSnapshot(state) };
}

export async function handleControlCenterPetMutationRequest(sender: unknown, controlCenterSender: unknown, petId: unknown, deps: ControlCenterPetMutationDependencies, options: { readonly allowBuiltIn?: boolean } = {}): Promise<ControlCenterPetMutationResult> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterSafePetId(petId, { allowBuiltIn: Boolean(options.allowBuiltIn) });
  return mutateControlCenterPet(petId, deps);
}

export function handleControlCenterGetPetsSnapshotRequest(sender: unknown, controlCenterSender: unknown, getState: () => OpenPetsStateV1): ControlCenterPetsSnapshot {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return buildControlCenterPetsSnapshot(getState());
}

export async function handleControlCenterGetPetCatalogSnapshotRequest(sender: unknown, controlCenterSender: unknown, getCatalog: () => Promise<CatalogUiState>): Promise<ControlCenterPetCatalogSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return sanitizeCatalogUiState(await getCatalog());
}

export async function handleControlCenterGetPetCatalogPageRequest(sender: unknown, controlCenterSender: unknown, page: unknown, getPage: (page: number) => Promise<CatalogUiState>): Promise<ControlCenterPetCatalogSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterCatalogPageInput(page);
  return sanitizeCatalogUiState(await getPage(page));
}

export async function handleControlCenterGetPetCatalogSearchRequest(sender: unknown, controlCenterSender: unknown, getSearch: () => Promise<CatalogSearchUiState>): Promise<ControlCenterPetCatalogSearchSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  const state = await getSearch();
  return { source: state.source, total: state.total, error: state.error, pets: state.pets.map((pet) => ({ id: pet.id, displayName: pet.displayName, searchText: pet.searchText, category: pet.category, catalogPage: pet.catalogPage, original: pet.original, featured: pet.featured })) };
}

export async function handleControlCenterGetCodexPetsSnapshotRequest(sender: unknown, controlCenterSender: unknown, getCodex: () => Promise<CodexPetUiState>): Promise<ControlCenterCodexPetsSnapshot> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  const state = await getCodex();
  return { source: "codex", error: state.error, pets: state.pets.map((pet) => ({ id: pet.id, displayName: pet.displayName, description: pet.description, preview: pet.preview, spritesheet: pet.spritesheet })) };
}

export function buildControlCenterPetsSnapshot(state: OpenPetsStateV1): ControlCenterPetsSnapshot {
  return { defaultPetId: state.preferences.defaultPetId, installedCount: state.pets.installed.length, pets: state.pets.installed.map((pet) => sanitizeInstalledPet(pet, state.preferences.defaultPetId)) };
}

export function setControlCenterLaunchAtLogin(enabled: boolean, deps: ControlCenterSetLaunchAtLoginDependencies): ControlCenterSetLaunchAtLoginResult {
  if (deps.isSupported()) {
    deps.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true });
  }
  return { settings: deps.getSettingsSnapshot() };
}

export function handleControlCenterSetLaunchAtLoginRequest(sender: unknown, controlCenterSender: unknown, enabled: unknown, deps: ControlCenterSetLaunchAtLoginDependencies): ControlCenterSetLaunchAtLoginResult {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterBooleanInput(enabled, "launchAtLogin.enabled");
  return setControlCenterLaunchAtLogin(enabled, deps);
}

export function setControlCenterPetScale(value: number, deps: ControlCenterSetPetScaleDependencies): ControlCenterSetPetScaleResult {
  deps.updatePreferences({ petScale: value });
  deps.refreshDefaultPetContent();
  deps.refreshAgentPetContent();
  return { settings: deps.getSettingsSnapshot() };
}

export function handleControlCenterSetPetScaleRequest(sender: unknown, controlCenterSender: unknown, value: unknown, deps: ControlCenterSetPetScaleDependencies): ControlCenterSetPetScaleResult {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  assertControlCenterPetScaleInput(value, deps.petScaleOptions);
  return setControlCenterPetScale(value, deps);
}

export function resetControlCenterDefaultPetPosition(deps: ControlCenterResetDefaultPetPositionDependencies): ControlCenterResetDefaultPetPositionResult {
  deps.resetDefaultPetToInitialPosition();
  return { settings: deps.getSettingsSnapshot() };
}

export function handleControlCenterResetDefaultPetPositionRequest(sender: unknown, controlCenterSender: unknown, deps: ControlCenterResetDefaultPetPositionDependencies): ControlCenterResetDefaultPetPositionResult {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return resetControlCenterDefaultPetPosition(deps);
}

export async function checkControlCenterUpdates(deps: ControlCenterCheckForUpdatesDependencies): Promise<{ settings: ControlCenterSettingsSnapshot }> {
  await deps.checkForGitHubReleaseUpdate();
  await deps.refreshTrayMenu();
  return { settings: deps.getSettingsSnapshot() };
}

export async function handleControlCenterCheckForUpdatesRequest(sender: unknown, controlCenterSender: unknown, deps: ControlCenterCheckForUpdatesDependencies): Promise<{ settings: ControlCenterSettingsSnapshot }> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return checkControlCenterUpdates(deps);
}

export async function handleControlCenterOpenUpdateReleasePageRequest(sender: unknown, controlCenterSender: unknown, deps: ControlCenterOpenUpdateReleasePageDependencies): Promise<void> {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  const updateStatus = deps.getUpdateStatus();
  if (updateStatus.state !== "available") {
    throw new Error(`Control Center IPC denied open update release page: update state is ${updateStatus.state}, expected available.`);
  }
  await deps.openUpdateReleasePage();
}

export function setControlCenterReactionAnimationOverride(reactionId: string, animationId: string, deps: ControlCenterReactionMappingMutationDependencies): ControlCenterReactionMappingMutationResult {
  assertControlCenterReactionId(reactionId, deps.reactionAnimationMetadata);
  assertControlCenterAnimationId(animationId, deps.selectableAnimationMetadata);
  const current = deps.state.preferences.reactionAnimationOverrides ?? {};
  const next = validateReactionAnimationOverrides({ ...current, [reactionId]: animationId });
  deps.updatePreferences({ reactionAnimationOverrides: next });
  deps.refreshDefaultPetContent();
  deps.refreshAgentPetContent();
  return { settings: deps.getSettingsSnapshot(), reactionMapping: deps.getReactionMappingSnapshot() };
}

export function resetControlCenterReactionAnimationOverride(reactionId: string, deps: ControlCenterReactionMappingMutationDependencies): ControlCenterReactionMappingMutationResult {
  assertControlCenterReactionId(reactionId, deps.reactionAnimationMetadata);
  const remaining: Record<string, string> = { ...(deps.state.preferences.reactionAnimationOverrides ?? {}) };
  delete remaining[reactionId];
  const next = validateReactionAnimationOverrides(remaining);
  deps.updatePreferences({ reactionAnimationOverrides: next });
  deps.refreshDefaultPetContent();
  deps.refreshAgentPetContent();
  return { settings: deps.getSettingsSnapshot(), reactionMapping: deps.getReactionMappingSnapshot() };
}

export function resetControlCenterReactionAnimationOverrides(deps: ControlCenterReactionMappingMutationDependencies): ControlCenterReactionMappingMutationResult {
  deps.updatePreferences({ reactionAnimationOverrides: undefined });
  deps.refreshDefaultPetContent();
  deps.refreshAgentPetContent();
  return { settings: deps.getSettingsSnapshot(), reactionMapping: deps.getReactionMappingSnapshot() };
}

export function handleControlCenterSetReactionAnimationOverrideRequest(sender: unknown, controlCenterSender: unknown, reactionId: unknown, animationId: unknown, deps: ControlCenterReactionMappingMutationDependencies): ControlCenterReactionMappingMutationResult {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  if (typeof reactionId !== "string" || typeof animationId !== "string") throw new Error("Control Center IPC invalid reaction mapping override input.");
  return setControlCenterReactionAnimationOverride(reactionId, animationId, deps);
}

export function handleControlCenterResetReactionAnimationOverrideRequest(sender: unknown, controlCenterSender: unknown, reactionId: unknown, deps: ControlCenterReactionMappingMutationDependencies): ControlCenterReactionMappingMutationResult {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  if (typeof reactionId !== "string") throw new Error("Control Center IPC invalid reaction id.");
  return resetControlCenterReactionAnimationOverride(reactionId, deps);
}

export function handleControlCenterResetReactionAnimationOverridesRequest(sender: unknown, controlCenterSender: unknown, deps: ControlCenterReactionMappingMutationDependencies): ControlCenterReactionMappingMutationResult {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return resetControlCenterReactionAnimationOverrides(deps);
}

export function buildControlCenterDashboardSnapshot(deps: ControlCenterSnapshotDependencies): ControlCenterDashboardSnapshot {
  return {
    appVersion: deps.appVersion,
    defaultPetName: getDefaultPetName(deps.state),
    onboardingCompleted: deps.state.preferences.onboardingCompleted,
    updateStatus: getControlCenterUpdateStatus(deps.updateStatus),
  };
}

export function buildControlCenterOnboardingSnapshot(state: OpenPetsStateV1): ControlCenterOnboardingSnapshot {
  return { defaultPetName: getDefaultPetName(state), onboardingCompleted: state.preferences.onboardingCompleted };
}

export function buildControlCenterSettingsSnapshot(deps: ControlCenterSnapshotDependencies): ControlCenterSettingsSnapshot {
  const scale = deps.petScaleOptions.find((option) => option.value === deps.state.preferences.petScale) ?? deps.petScaleOptions[1] ?? deps.petScaleOptions[0];
  const overrides = deps.state.preferences.reactionAnimationOverrides ?? {};
  const overrideLabels = deps.reactionAnimationMetadata
    .filter((reaction) => Object.hasOwn(overrides, reaction.id))
    .map((reaction) => reaction.label);

  return {
    appVersion: deps.appVersion,
    onboardingCompleted: deps.state.preferences.onboardingCompleted,
    defaultPetName: getDefaultPetName(deps.state),
    launchAtLogin: deps.launchAtLogin,
    updateStatus: getControlCenterUpdateStatus(deps.updateStatus),
    petScale: {
      value: scale?.value ?? deps.state.preferences.petScale,
      label: scale?.label ?? "Custom",
    },
    petScaleOptions: deps.petScaleOptions.map((option) => ({ value: option.value, label: option.label })),
    reactionAnimations: {
      totalReactions: deps.reactionAnimationMetadata.length,
      overriddenReactions: overrideLabels.length,
      overrideLabels,
    },
  };
}

export function buildControlCenterReactionMappingSnapshot(deps: ControlCenterSnapshotDependencies): ControlCenterReactionMappingSnapshot {
  const overrides: Readonly<Record<string, string>> = deps.state.preferences.reactionAnimationOverrides ?? {};
  return {
    reactions: deps.reactionAnimationMetadata.map((reaction) => ({
      id: reaction.id,
      label: reaction.label,
      description: reaction.description,
      defaultAnimation: reaction.defaultAnimation,
      currentAnimation: overrides[reaction.id] ?? reaction.defaultAnimation,
      overridden: Object.hasOwn(overrides, reaction.id),
    })),
    selectableAnimations: deps.selectableAnimationMetadata.map((animation) => ({ id: animation.id, label: animation.label, description: animation.description })),
    overrides: Object.entries(overrides).map(([reactionId, animationId]) => ({ reactionId, animationId })),
    spriteMetadata: {
      previewUrl: deps.defaultPetSprite.previewUrl ?? "openpets-pet-preview://spritesheet/default",
      version: deps.defaultPetSprite.version ?? "",
      spriteFileName: deps.defaultPetSprite.fileName,
      frameWidth: deps.defaultPetSprite.frameWidth,
      frameHeight: deps.defaultPetSprite.frameHeight,
      columns: deps.defaultPetSprite.columns,
      rows: deps.defaultPetSprite.rows,
      states: Object.entries(deps.defaultPetSprite.states).map(([id, state]) => ({ id, row: state.row, frames: state.frames, durationMs: state.durationMs, iterations: state.iterations })),
    },
  };
}

function assertControlCenterReactionId(value: string, metadata: ControlCenterSnapshotDependencies["reactionAnimationMetadata"]): void {
  if (!metadata.some((reaction) => reaction.id === value)) throw new Error("Control Center IPC invalid reaction id.");
}

function assertControlCenterAnimationId(value: string, metadata: ControlCenterSnapshotDependencies["selectableAnimationMetadata"]): void {
  if (!metadata.some((animation) => animation.id === value)) throw new Error("Control Center IPC invalid animation id.");
}

export function handleControlCenterGetReactionMappingSnapshotRequest(sender: unknown, controlCenterSender: unknown, getDeps: () => ControlCenterSnapshotDependencies): ControlCenterReactionMappingSnapshot {
  assertAuthorizedControlCenterSender(sender, controlCenterSender);
  return buildControlCenterReactionMappingSnapshot(getDeps());
}

function getDefaultPetName(state: OpenPetsStateV1): string {
  const defaultPet = state.pets.installed.find((pet) => pet.id === state.preferences.defaultPetId && !pet.broken) ?? state.pets.installed[0];
  return defaultPet?.displayName ?? "Built-in Pet";
}

function sanitizeInstalledPet(pet: InstalledPetState, defaultPetId: string): ControlCenterPetsSnapshot["pets"][number] {
  const catalogPreview = pet.source?.kind === "catalog" ? sanitizeInstalledCatalogPreview(pet.source.preview) : undefined;
  const source = pet.source?.kind === "catalog" ? (catalogPreview ? { kind: "catalog" as const, preview: catalogPreview } : { kind: "catalog" as const }) : pet.source?.kind === "codex" ? { kind: "codex" as const } : undefined;
  return { id: pet.id, displayName: pet.displayName, description: pet.description, builtIn: pet.builtIn, protected: pet.protected, installed: pet.installed, default: pet.id === defaultPetId, broken: Boolean(pet.broken), source };
}

function sanitizeInstalledCatalogPreview(preview: string | undefined): string | undefined {
  if (!preview) return undefined;
  try {
    const url = new URL(preview);
    if (url.protocol !== "https:" || url.hostname !== "openpets.dev" || url.port || url.username || url.password || !url.pathname.startsWith("/pets/")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function sanitizeCatalogUiState(state: CatalogUiState): ControlCenterPetCatalogSnapshot {
  return {
    source: state.source,
    pets: state.pets.map((pet) => ({ id: pet.id, displayName: pet.displayName, description: pet.description, preview: pet.preview, spritesheet: pet.spritesheet, category: pet.category, subcategory: pet.subcategory, original: pet.original, featured: pet.featured })),
    generatedAt: state.generatedAt,
    error: state.error,
    version: state.version,
    total: state.total,
    categories: state.categories,
    page: state.page,
    pageCount: state.pageCount,
    supportsCategories: state.supportsCategories,
    originalsCount: state.originalsCount,
    featuredCount: state.featuredCount,
  };
}

function getControlCenterUpdateStatus(updateStatus: UpdateStatusLike): ControlCenterUpdateStatusSnapshot {
  return {
    state: updateStatus.state,
    currentVersion: updateStatus.currentVersion,
    latestVersion: updateStatus.latestVersion,
    checkedAt: updateStatus.checkedAt,
    error: updateStatus.error,
  };
}
