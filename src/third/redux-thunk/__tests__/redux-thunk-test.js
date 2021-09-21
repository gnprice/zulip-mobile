import thunkMiddleware from '../index';

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
      it('must run the given action function with dispatch and getState', () => {
        const actionHandler = nextHandler();

        return new Promise(resolve =>
          actionHandler((dispatch, getState) => {
            expect(dispatch).toStrictEqual(doDispatch);
            expect(getState).toStrictEqual(doGetState);
            resolve();
          }),
        );
      });

      it('must pass action to next if not a function', () => {
        const actionObj = {};

        return new Promise(resolve => {
          const actionHandler = nextHandler(action => {
            expect(action).toStrictEqual(actionObj);
            resolve();
          });

          actionHandler(actionObj);
        });
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
    it('must pass the third argument', () => {
      const extraArg = { lol: true };
      return new Promise(resolve => {
        thunkMiddleware.withExtraArgument(extraArg)({
          dispatch: doDispatch,
          getState: doGetState,
        })()((dispatch, getState, arg) => {
          expect(dispatch).toStrictEqual(doDispatch);
          expect(getState).toStrictEqual(doGetState);
          expect(arg).toStrictEqual(extraArg);
          resolve();
        });
      });
    });
  });
});
