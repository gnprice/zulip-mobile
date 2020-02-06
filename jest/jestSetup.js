import mockAsyncStorage from '@react-native-community/async-storage/jest/async-storage-mock';

jest.mock('@react-native-community/async-storage', () => mockAsyncStorage);

jest.mock('react-native-sound', () => () => ({
  play: jest.fn(),
}));

jest.mock('Linking', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
}));

jest.mock('rn-fetch-blob', () => ({
  DocumentDir: () => {},
}));

// Set up our `logging` module with mocks, which tests can use as desired.
//
// This global version just passes the calls right through to the real
// implementations.  To suppress logging in a specific test, make a call
// like `logging.warn.mockReturnValue()`.  For more, see:
//   https://jestjs.io/docs/en/mock-function-api
// or search our code for `logging.warn.` for examples.
jest.mock('../src/utils/logging', () => {
  const logging = jest.requireActual('../src/utils/logging');
  return {
    __esModule: true, // eslint-disable-line id-match
    error: jest.fn().mockImplementation(logging.error),
    warn: jest.fn().mockImplementation(logging.warn),
  };
});
