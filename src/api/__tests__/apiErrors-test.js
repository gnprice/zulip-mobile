/* @flow strict-local */
import {
  isClientError,
  ApiError,
  isServerError,
  isNetworkRequestFailedError,
  isRetryable,
} from '../apiErrors';

const allPredicates = [isClientError, isServerError, isNetworkRequestFailedError, isRetryable];

describe('predicates identify errors properly', () => {
  describe.each([
    [
      'an API error with error code between 400 and 499',
      [isClientError],
      new ApiError(404, {
        code: 'BAD_IMAGE',
        result: 'error',
        msg: 'File not found',
      }),
    ],
    [
      'an API error with error code between 500 and 599',
      [isServerError, isRetryable],
      new ApiError(500, {
        code: 'SOME_ERROR_CODE',
        msg: 'Internal Server Error',
        result: 'error',
      }),
    ],
    [
      "a TypeError with message 'Network request failed'",
      [isNetworkRequestFailedError, isRetryable],
      new TypeError('Network request failed'),
    ],
  ])('%s', (description, predicatesExpectedTrue, error) => {
    const predicatesExpectedFalse = allPredicates.filter(p => !predicatesExpectedTrue.includes(p));

    predicatesExpectedTrue.forEach(p => {
      test(`${p.name}(error) is true`, () => {
        expect(p(error)).toBeTrue();
      });
    });
    predicatesExpectedFalse.forEach(p => {
      test(`${p.name}(error) is false`, () => {
        expect(p(error)).toBeFalse();
      });
    });
  });
});
