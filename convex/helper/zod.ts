import { NoOp } from 'convex-helpers/server/customFunctions';
import {
  zCustomQuery,
  zCustomMutation,
  zCustomAction,
} from 'convex-helpers/server/zod';
import {
  query,
  internalQuery,
  mutation,
  internalMutation,
  action,
  internalAction,
} from '../_generated/server';

export const zQuery = zCustomQuery(query, NoOp);
export const zInternalQuery = zCustomQuery(internalQuery, NoOp);

export const zMutation = zCustomMutation(mutation, NoOp);
export const zInternalMutation = zCustomMutation(internalMutation, NoOp);

export const zAction = zCustomAction(action, NoOp);
export const zInternalAction = zCustomAction(internalAction, NoOp);
