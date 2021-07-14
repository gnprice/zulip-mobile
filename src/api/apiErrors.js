/* @flow strict-local */
import type { ApiErrorCode, ApiResponseErrorData } from './transportTypes';

export class RequestError extends Error {
  +httpStatus: number | void;
  +data: mixed;
}

/** Runtime class of custom API error types. */
export class ApiError extends RequestError {
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

export class NetworkError extends RequestError {}

export class ServerError extends RequestError {
  httpStatus: number;

  constructor(msg: string, httpStatus: number) {
    super(msg);
    this.httpStatus = httpStatus;
  }
}

export class Server5xxError extends ServerError {
  constructor(httpStatus: number) {
    super(`Network request failed: HTTP status ${httpStatus}`, httpStatus);
  }
}

export class MalformedResponseError extends ServerError {
  constructor(httpStatus: number, data: mixed) {
    super(`Server responded with invalid message; HTTP status ${httpStatus}`, httpStatus);
    this.data = data;
  }
}

/**
 * Return the data on success; otherwise, throw a nice {@link RequestError}.
 */
export const interpretApiResponse = (httpStatus: number, data: mixed): mixed => {
  if (httpStatus >= 200 && httpStatus <= 299) {
    // Status code says success…

    if (data === undefined) {
      // … but response couldn't be parsed as JSON.  Seems like a server bug.
      throw new MalformedResponseError(httpStatus, data);
    }

    // … and we got a JSON response, too.  So we can return the data.
    return data;
  }

  if (httpStatus >= 500 && httpStatus <= 599) {
    // Server error.  Ignore `data`; it's unlikely to be a well-formed Zulip
    // API error blob, and its meaning is undefined if it somehow is.
    throw new Server5xxError(httpStatus);
  }

  if (typeof data === 'object' && data !== null) {
    const { result, msg, code = 'BAD_REQUEST' } = data;
    if (result === 'error' && typeof msg === 'string' && typeof code === 'string') {
      // Hooray, we have a well-formed Zulip API error blob.  Use that.
      throw new ApiError(httpStatus, { ...data, result, msg, code });
    }
  }

  // Server has responded, but the response is not a valid error-object.
  // (This should never happen, even on old versions of the Zulip server.)
  throw new MalformedResponseError(httpStatus, data);
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
export const isServerError = (e: Error): boolean => e instanceof ServerError;

/**
 * Is the error `fetch`'s network-request error?
 *
 * There are several possible causes for this error:
 *   https://fetch.spec.whatwg.org/#ref-for-concept-network-error%E2%91%A5%E2%93%AA
 */
export const isNetworkRequestFailedError = (e: Error): boolean => e instanceof NetworkError;

/**
 * Might the same request succeed if we retried it?
 */
export const isRetryable = (e: Error): boolean =>
  isServerError(e) || isNetworkRequestFailedError(e);
