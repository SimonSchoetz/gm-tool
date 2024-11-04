/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cron_jobs_sessions from "../cron_jobs/sessions.js";
import type * as crons from "../crons.js";
import type * as helper_index from "../helper/index.js";
import type * as helper_signature from "../helper/signature.js";
import type * as helper_zod from "../helper/zod.js";
import type * as sessions_create_session from "../sessions/create_session.js";
import type * as sessions_delete_session from "../sessions/delete_session.js";
import type * as sessions_get_session from "../sessions/get_session.js";
import type * as sessions_index from "../sessions/index.js";
import type * as sessions_update_session from "../sessions/update_session.js";
import type * as tables_index from "../tables/index.js";
import type * as tables_sessions_table from "../tables/sessions_table.js";
import type * as tables_users_table from "../tables/users_table.js";
import type * as users_create_users from "../users/create_users.js";
import type * as users_get_users from "../users/get_users.js";
import type * as users_index from "../users/index.js";
import type * as users_update_user from "../users/update_user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "cron_jobs/sessions": typeof cron_jobs_sessions;
  crons: typeof crons;
  "helper/index": typeof helper_index;
  "helper/signature": typeof helper_signature;
  "helper/zod": typeof helper_zod;
  "sessions/create_session": typeof sessions_create_session;
  "sessions/delete_session": typeof sessions_delete_session;
  "sessions/get_session": typeof sessions_get_session;
  "sessions/index": typeof sessions_index;
  "sessions/update_session": typeof sessions_update_session;
  "tables/index": typeof tables_index;
  "tables/sessions_table": typeof tables_sessions_table;
  "tables/users_table": typeof tables_users_table;
  "users/create_users": typeof users_create_users;
  "users/get_users": typeof users_get_users;
  "users/index": typeof users_index;
  "users/update_user": typeof users_update_user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
