/* @flow strict-local */
import { isClientError, ApiError, isServerError, isNetworkRequestFailedError } from '../apiErrors';

const allPredicates = [isClientError, isServerError, isNetworkRequestFailedError];

describe('predicates identify errors properly', () => {
  describe.each([
    [
      'an API error with error code between 400 and 499',
      isClientError,
      new ApiError(404, {
        code: 'BAD_IMAGE',
        result: 'error',
        msg: 'File not found',
      }),
    ],
    [
      'an API error with error code between 500 and 599',
      isServerError,
      new ApiError(500, {
        code: 'SOME_ERROR_CODE',
        msg: 'Internal Server Error',
        result: 'error',
      }),
    ],
    [
      "a TypeError with message 'Network request failed'",
      isNetworkRequestFailedError,
      new TypeError('Network request failed'),
    ],
  ])('%s', (description, predicateExpectedTrue, error) => {
    const predicatesExpectedTrue = [predicateExpectedTrue]; // we'll add more soon
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
