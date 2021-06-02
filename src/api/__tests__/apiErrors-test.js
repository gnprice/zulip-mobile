/* @flow strict-local */
import { isClientError, ApiError, isServerError, isNetworkRequestFailedError } from '../apiErrors';

describe('an API error with error code between 400 and 499', () => {
  const error = new ApiError(404, {
    code: 'BAD_IMAGE',
    result: 'error',
    msg: 'File not found',
  });

  test('is a "client error"', () => {
    expect(isClientError(error)).toBe(true);
  });

  test('is not a "server error"', () => {
    expect(isServerError(error)).toBe(false);
  });

  test('is not a network request failed error', () => {
    expect(isNetworkRequestFailedError(error)).toBe(false);
  });
});

describe('an API error with error code between 500 and 599', () => {
  const error = new ApiError(500, {
    code: 'SOME_ERROR_CODE',
    msg: 'Internal Server Error',
    result: 'error',
  });

  test('is a "server error"', () => {
    expect(isServerError(error)).toBe(true);
  });

  test('is not a "client error"', () => {
    expect(isClientError(error)).toBe(false);
  });

  test('is not a network request failed error', () => {
    expect(isNetworkRequestFailedError(error)).toBe(false);
  });
});

describe("a TypeError with message 'Network request failed'", () => {
  const error = new TypeError('Network request failed');

  test('is a network request failed error', () => {
    expect(isNetworkRequestFailedError(error)).toBe(true);
  });

  test('is not a "server error"', () => {
    expect(isServerError(error)).toBe(false);
  });

  test('is not a "client error"', () => {
    expect(isClientError(error)).toBe(false);
  });
});
