/* @flow strict-local */
import type { ApiErrorCode, ApiResponseErrorData } from './transportTypes';
import * as logging from '../utils/logging';

/** Runtime class of custom API error types. */
export class ApiError extends Error {
  code: ApiErrorCode;
  data: $ReadOnly<{ ... }>;
  httpStatus: number;

  constructor(httpStatus: number, data: $ReadOnly<ApiResponseErrorData>) {
    // eslint-disable-next-line no-unused-vars
    const { result, code, msg, ...rest } = data;
    super(msg);
    this.data = rest;
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * Given a server response (allegedly) denoting an error, produce an Error to be
 * thrown.
 *
 * If the `data` argument is actually of the form expected from the server, the
 * returned error will be an {@link ApiError}; otherwise it will be a generic
 * Error.
 */
export const makeErrorFromApi = (httpStatus: number, data: mixed): Error => {
  if (httpStatus >= 500 && httpStatus <= 599) {
    // Server error.  Ignore `data`; it's unlikely to be a well-formed Zulip
    // API error blob, and its meaning is undefined if it somehow is.
    return new Error(`Network request failed: HTTP error ${httpStatus}`);
  }

  // Validate `data`, and construct the resultant error object.
  if (typeof data === 'object' && data !== null) {
    const { result, msg, code } = data;
    if (result === 'error' && typeof msg === 'string') {
      // If `code` is present, it must be a string.
      if (code === undefined || typeof code === 'string') {
        // Default to 'BAD_REQUEST' if `code` is not present.
        return new ApiError(httpStatus, {
          ...data,
          result,
          msg,
          code: code ?? 'BAD_REQUEST',
        });
      }
    }
  }

  // Server has responded, but the response is not a valid error-object.
  // (This should never happen, even on old versions of the Zulip server.)
  logging.warn(`Bad response from server: ${JSON.stringify(data) ?? 'undefined'}`);
  return new Error('Server responded with invalid message');
};

/**
 * Is exception caused by a Client Error (4xx)?
 *
 * Client errors are often caused by incorrect parameters given to the backend
 * by the client application.
 *
 * A Client (4xx) error will not be resolved by waiting and retrying
 * the same request.
 */
export const isClientError = (e: Error): boolean =>
  e instanceof ApiError && e.httpStatus >= 400 && e.httpStatus <= 499;

/**
 * Is exception caused by a Server Error (5xx)?
 *
 * A Server (5xx) error may or may not be resolved by waiting a short
 * time and retrying the same request.
 */
export const isServerError = (e: Error): boolean =>
  e instanceof ApiError && e.httpStatus >= 500 && e.httpStatus <= 599;

/**
 * Is the error `fetch`'s network-request error?
 *
 * There are several possible causes for this error:
 *   https://fetch.spec.whatwg.org/#ref-for-concept-network-error%E2%91%A5%E2%93%AA
 */
export const isNetworkRequestFailedError = (e: Error): boolean =>
  e instanceof TypeError && e.message === 'Network request failed';

/**
 * Might the same request succeed if we retried it?
 */
export const isRetryable = (e: Error): boolean =>
  isServerError(e) || isNetworkRequestFailedError(e);
