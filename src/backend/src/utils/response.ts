import { Response } from "express";

// ---------------------------------------------------------------------------
// Typed response envelopes
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Senders
// ---------------------------------------------------------------------------

export function sendOk<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ ok: true, data } satisfies ApiSuccess<T>);
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  details?: unknown
): void {
  const body: ApiError = { ok: false, error: message };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

// ---------------------------------------------------------------------------
// Convenience shorthands
// ---------------------------------------------------------------------------

export const send400 = (res: Response, msg: string) =>
  sendError(res, 400, msg);

export const send401 = (res: Response, msg = "Unauthorized") =>
  sendError(res, 401, msg);

export const send403 = (res: Response, msg = "Forbidden") =>
  sendError(res, 403, msg);

export const send404 = (res: Response, msg = "Not found") =>
  sendError(res, 404, msg);

export const send500 = (res: Response, msg = "Internal server error") =>
  sendError(res, 500, msg);