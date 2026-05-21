import type { AgentSetupAction, AgentSetupCommandPaths, AgentSetupSnapshot } from "../agent-setup.js";
import type { PluginCatalogSnapshot, PluginServiceResult, PluginServiceSnapshot } from "../plugin-service.js";

export type ControlCenterAgentSetupAction = AgentSetupAction;
export type ControlCenterAgentSetupSnapshot = AgentSetupSnapshot;
export type ControlCenterAgentSetupCommandPaths = AgentSetupCommandPaths;
export type ControlCenterAgentSetupCommandMode = "published" | "local" | "bundled";
export type ControlCenterPluginsSnapshot = PluginServiceSnapshot;
export type ControlCenterPluginResult = PluginServiceResult;
export type ControlCenterPluginCatalogSnapshot = PluginCatalogSnapshot;

export interface ControlCenterUpdateStatusSnapshot {
  readonly state: "idle" | "checking" | "available" | "current" | "error";
  readonly currentVersion: string;
  readonly latestVersion?: string;
  readonly checkedAt?: number;
  readonly error?: string;
}

export interface ControlCenterDashboardSnapshot {
  readonly appVersion: string;
  readonly defaultPetName: string;
  readonly onboardingCompleted: boolean;
  readonly updateStatus: ControlCenterUpdateStatusSnapshot;
}

export interface ControlCenterOnboardingSnapshot {
  readonly defaultPetName: string;
  readonly onboardingCompleted: boolean;
}

export interface ControlCenterLaunchAtLoginSnapshot {
  readonly supported: boolean;
  readonly enabled: boolean;
}

export interface ControlCenterReactionAnimationSummarySnapshot {
  readonly totalReactions: number;
  readonly overriddenReactions: number;
  readonly overrideLabels: readonly string[];
}

export interface ControlCenterReactionMappingSnapshot {
  readonly reactions: readonly {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly defaultAnimation: string;
    readonly currentAnimation: string;
    readonly overridden: boolean;
  }[];
  readonly selectableAnimations: readonly {
    readonly id: string;
    readonly label: string;
    readonly description: string;
  }[];
  readonly overrides: readonly {
    readonly reactionId: string;
    readonly animationId: string;
  }[];
  readonly spriteMetadata: {
    readonly previewUrl: string;
    readonly version: string;
    readonly spriteFileName: string;
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly columns: number;
    readonly rows: number;
    readonly states: readonly {
      readonly id: string;
      readonly row: number;
      readonly frames: number;
      readonly durationMs: number;
      readonly iterations?: number | "infinite";
    }[];
  };
}

export interface ControlCenterSettingsSnapshot {
  readonly appVersion: string;
  readonly onboardingCompleted: boolean;
  readonly defaultPetName: string;
  readonly launchAtLogin: ControlCenterLaunchAtLoginSnapshot;
  readonly updateStatus: ControlCenterUpdateStatusSnapshot;
  readonly petScale: {
    readonly value: number;
    readonly label: string;
  };
  readonly petScaleOptions: readonly {
    readonly value: number;
    readonly label: string;
  }[];
  readonly reactionAnimations: ControlCenterReactionAnimationSummarySnapshot;
}

export interface ControlCenterSetLaunchAtLoginResult {
  readonly settings: ControlCenterSettingsSnapshot;
}

export interface ControlCenterSetPetScaleResult {
  readonly settings: ControlCenterSettingsSnapshot;
}

export interface ControlCenterResetDefaultPetPositionResult {
  readonly settings: ControlCenterSettingsSnapshot;
}

export interface ControlCenterReactionMappingMutationResult {
  readonly settings: ControlCenterSettingsSnapshot;
  readonly reactionMapping: ControlCenterReactionMappingSnapshot;
}

export interface ControlCenterCheckForUpdatesResult {
  readonly settings: ControlCenterSettingsSnapshot;
}

export interface ControlCenterPetMutationResult {
  readonly pets: ControlCenterPetsSnapshot;
}

export interface ControlCenterInstalledPetSnapshot {
  readonly id: string;
  readonly displayName: string;
  readonly description?: string;
  readonly builtIn: boolean;
  readonly protected: boolean;
  readonly installed: boolean;
  readonly default: boolean;
  readonly broken: boolean;
  readonly source?: { readonly kind: "catalog"; readonly preview?: string } | { readonly kind: "codex" };
}

export interface ControlCenterPetsSnapshot {
  readonly defaultPetId: string;
  readonly installedCount: number;
  readonly pets: readonly ControlCenterInstalledPetSnapshot[];
}

export interface ControlCenterCatalogPetSnapshot {
  readonly id: string;
  readonly displayName: string;
  readonly description?: string;
  readonly preview?: string;
  readonly spritesheet?: string;
  readonly category?: "western" | "asian";
  readonly subcategory?: string;
  readonly original?: boolean;
  readonly featured?: boolean;
}

export interface ControlCenterPetCatalogSnapshot {
  readonly source: "remote" | "fixture" | "error";
  readonly pets: readonly ControlCenterCatalogPetSnapshot[];
  readonly generatedAt?: string;
  readonly error?: string;
  readonly version?: 2 | 3;
  readonly total?: number;
  readonly categories?: readonly { readonly id: "western" | "asian"; readonly label: string; readonly count: number }[];
  readonly page?: number;
  readonly pageCount?: number;
  readonly supportsCategories?: boolean;
  readonly originalsCount?: number;
  readonly featuredCount?: number;
}

export interface ControlCenterPetCatalogSearchSnapshot {
  readonly source: "remote" | "error";
  readonly total?: number;
  readonly error?: string;
  readonly pets: readonly { readonly id: string; readonly displayName: string; readonly searchText: string; readonly category: "western" | "asian"; readonly catalogPage: number; readonly original?: boolean; readonly featured?: boolean }[];
}

export interface ControlCenterCodexPetsSnapshot {
  readonly source: "codex";
  readonly error?: string;
  readonly pets: readonly { readonly id: string; readonly displayName: string; readonly description: string; readonly preview: string; readonly spritesheet: string }[];
}

export interface OpenPetsControlCenterApi {
  readonly getDashboardSnapshot: () => Promise<ControlCenterDashboardSnapshot>;
  readonly getOnboardingSnapshot: () => Promise<ControlCenterOnboardingSnapshot>;
  readonly completeOnboarding: () => Promise<ControlCenterOnboardingSnapshot>;
  readonly openPetsFromOnboarding: () => Promise<void>;
  readonly openIntegrationsFromOnboarding: () => Promise<void>;
  readonly getSettingsSnapshot: () => Promise<ControlCenterSettingsSnapshot>;
  readonly getReactionMappingSnapshot: () => Promise<ControlCenterReactionMappingSnapshot>;
  readonly getPetsSnapshot: () => Promise<ControlCenterPetsSnapshot>;
  readonly getPetCatalogSnapshot: () => Promise<ControlCenterPetCatalogSnapshot>;
  readonly getPetCatalogPage: (page: number) => Promise<ControlCenterPetCatalogSnapshot>;
  readonly getPetCatalogSearch: () => Promise<ControlCenterPetCatalogSearchSnapshot>;
  readonly getCodexPetsSnapshot: () => Promise<ControlCenterCodexPetsSnapshot>;
  readonly setLaunchAtLogin: (enabled: boolean) => Promise<ControlCenterSetLaunchAtLoginResult>;
  readonly setPetScale: (value: number) => Promise<ControlCenterSetPetScaleResult>;
  readonly resetDefaultPetPosition: () => Promise<ControlCenterResetDefaultPetPositionResult>;
  readonly setReactionAnimationOverride: (reactionId: string, animationId: string) => Promise<ControlCenterReactionMappingMutationResult>;
  readonly resetReactionAnimationOverride: (reactionId: string) => Promise<ControlCenterReactionMappingMutationResult>;
  readonly resetReactionAnimationOverrides: () => Promise<ControlCenterReactionMappingMutationResult>;
  readonly checkForUpdates: () => Promise<ControlCenterCheckForUpdatesResult>;
  readonly openUpdateReleasePage: () => Promise<void>;
  readonly setDefaultPet: (petId: string) => Promise<ControlCenterPetMutationResult>;
  readonly installCatalogPet: (petId: string) => Promise<ControlCenterPetMutationResult>;
  readonly importCodexPet: (petId: string) => Promise<ControlCenterPetMutationResult>;
  readonly removeInstalledPet: (petId: string) => Promise<ControlCenterPetMutationResult>;
  readonly getAgentSetupSnapshot: (selectedPetId?: string, commandMode?: ControlCenterAgentSetupCommandMode) => Promise<ControlCenterAgentSetupSnapshot>;
  readonly runAgentSetupAction: (action: ControlCenterAgentSetupAction, selectedPetId?: string, commandMode?: ControlCenterAgentSetupCommandMode) => Promise<ControlCenterAgentSetupSnapshot>;
  readonly updateAgentSetupCommandPaths: (patch: Partial<ControlCenterAgentSetupCommandPaths>) => Promise<ControlCenterAgentSetupCommandPaths>;
  readonly getPluginsSnapshot: () => Promise<ControlCenterPluginsSnapshot>;
  readonly setPluginEnabled: (id: string, enabled: boolean) => Promise<ControlCenterPluginResult>;
  readonly savePluginConfig: (id: string, config: unknown) => Promise<ControlCenterPluginResult>;
  readonly reloadPlugin: (id: string) => Promise<ControlCenterPluginResult>;
  readonly executePluginCommand: (id: string, commandId: string) => Promise<ControlCenterPluginResult>;
  readonly loadLocalPlugin: () => Promise<ControlCenterPluginResult>;
  readonly getPluginCatalogSnapshot: (refresh?: boolean) => Promise<ControlCenterPluginCatalogSnapshot>;
  readonly installCatalogPlugin: (id: string) => Promise<ControlCenterPluginResult>;
  readonly updateCatalogPlugin: (id: string) => Promise<ControlCenterPluginResult>;
  readonly uninstallPlugin: (id: string) => Promise<ControlCenterPluginResult>;
}

declare global {
  interface Window {
    readonly openPetsControlCenter: OpenPetsControlCenterApi;
  }
}

export {};
