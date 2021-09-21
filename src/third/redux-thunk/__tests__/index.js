// NB this test file doesn't yet actually get run.

import thunkMiddleware from '../index';

/* eslint-disable jest/no-done-callback */

describe('thunk middleware', () => {
  const doDispatch = () => {};
  const doGetState = () => {};
  const nextHandler = thunkMiddleware({ dispatch: doDispatch, getState: doGetState });

  it('must return a function to handle next', () => {
    expect(nextHandler).toBeFunction();
    expect(nextHandler.length).toStrictEqual(1);
  });

  describe('handle next', () => {
    it('must return a function to handle action', () => {
      const actionHandler = nextHandler();

      expect(actionHandler).toBeFunction();
      expect(actionHandler.length).toStrictEqual(1);
    });

    describe('handle action', () => {
      it('must run the given action function with dispatch and getState', done => {
        const actionHandler = nextHandler();

        actionHandler((dispatch, getState) => {
          expect(dispatch).toStrictEqual(doDispatch);
          expect(getState).toStrictEqual(doGetState);
          done();
        });
      });

      it('must pass action to next if not a function', done => {
        const actionObj = {};

        const actionHandler = nextHandler(action => {
          expect(action).toStrictEqual(actionObj);
          done();
        });

        actionHandler(actionObj);
      });

      it('must return the return value of next if not a function', () => {
        const expected = 'redux';
        const actionHandler = nextHandler(() => expected);

        const outcome = actionHandler();
        expect(outcome).toStrictEqual(expected);
      });

      it('must return value as expected if a function', () => {
        const expected = 'rocks';
        const actionHandler = nextHandler();

        const outcome = actionHandler(() => expected);
        expect(outcome).toStrictEqual(expected);
      });

      it('must be invoked synchronously if a function', () => {
        const actionHandler = nextHandler();
        let mutated = 0;

        actionHandler(() => mutated++);
        expect(mutated).toStrictEqual(1);
      });
    });
  });

  describe('handle errors', () => {
    it('must throw if argument is non-object', () => {
      expect(() => thunkMiddleware()).toThrow();
    });
  });

  describe('withExtraArgument', () => {
    it('must pass the third argument', done => {
      const extraArg = { lol: true };
      thunkMiddleware.withExtraArgument(extraArg)({
        dispatch: doDispatch,
        getState: doGetState,
      })()((dispatch, getState, arg) => {
        expect(dispatch).toStrictEqual(doDispatch);
        expect(getState).toStrictEqual(doGetState);
        expect(arg).toStrictEqual(extraArg);
        done();
      });
    });
  });
});
