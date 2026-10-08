/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiSpend from "../aiSpend.js";
import type * as crons from "../crons.js";
import type * as editionFields from "../editionFields.js";
import type * as editions from "../editions.js";
import type * as http from "../http.js";
import type * as mail from "../mail.js";
import type * as mailActions from "../mailActions.js";
import type * as meteredClaude from "../meteredClaude.js";
import type * as prompts from "../prompts.js";
import type * as research from "../research.js";
import type * as researchActions from "../researchActions.js";
import type * as researchPrompt from "../researchPrompt.js";
import type * as theses from "../theses.js";
import type * as thesisActions from "../thesisActions.js";
import type * as thesisChatActions from "../thesisChatActions.js";
import type * as thesisConversation from "../thesisConversation.js";
import type * as thesisFields from "../thesisFields.js";
import type * as tracking from "../tracking.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiSpend: typeof aiSpend;
  crons: typeof crons;
  editionFields: typeof editionFields;
  editions: typeof editions;
  http: typeof http;
  mail: typeof mail;
  mailActions: typeof mailActions;
  meteredClaude: typeof meteredClaude;
  prompts: typeof prompts;
  research: typeof research;
  researchActions: typeof researchActions;
  researchPrompt: typeof researchPrompt;
  theses: typeof theses;
  thesisActions: typeof thesisActions;
  thesisChatActions: typeof thesisChatActions;
  thesisConversation: typeof thesisConversation;
  thesisFields: typeof thesisFields;
  tracking: typeof tracking;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
};
