import { KEY_PREFIX, REHYDRATE } from './constants'
import purgeStoredState from './purgeStoredState'
import stringify from 'json-stringify-safe'

export default function createPersistor (store, config) {
  // defaults
  let serializer;
  if (config.serialize === false) {
    serializer = (data) => data
  } else if (typeof config.serialize === 'function') {
    serializer = config.serialize
  } else {
    serializer = defaultSerializer
  }

  let deserializer;
  if (config.deserialize === false) {
    deserializer = (data) => data
  } else if (typeof config.deserialize === 'function') {
    deserializer = config.deserialize
  } else {
    deserializer = defaultDeserializer
  }
  const blacklist = config.blacklist || []
  const whitelist = config.whitelist || false
  const transforms = config.transforms || []
  const debounce = config.debounce || false
  const keyPrefix = config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX

  // pluggable state shape (e.g. immutablejs)
  const stateInit = config._stateInit || {}
  const stateIterator = config._stateIterator || defaultStateIterator
  const stateGetter = config._stateGetter || defaultStateGetter
  const stateSetter = config._stateSetter || defaultStateSetter

  const storage = config.storage;

  let lastWrittenState = stateInit
  let writeInProgress = false

  store.subscribe(() => {
    if (!writeInProgress)
      write();
  })

  async function write() {
    // Take the lock.
    writeInProgress = true;
    // Then yield so the `subscribe` callback can promptly return.
    await new Promise(setTimeout);

    try {
      let state = undefined;
      while ((state = store.getState()) !== lastWrittenState) {
        await writeOnce(state);
      }
    } finally {
      // Release the lock, so the next `subscribe` will start the loop again.
      writeInProgress = false;
    }
  }

  /**
   * Update the storage to the given state.
   *
   * The storage is assumed to already reflect `lastWrittenState`.
   * On completion, sets `lastWrittenState` to `state`.
   */
  async function writeOnce(state) {
    // Atomically collect the subtrees that need to be written out.
    const updatedSubstates = [];
    for (const key of state.keys()) {
      if (state[key] === lastWrittenState[key])
        continue;
      updatedSubstates.push([key, state[key]]);
    }

    // Serialize those subtrees, with yields after each one.
    const writes = [];
    for (const [key, substate] of updatedSubstates) {
      writes.push([key, serializer(substate)]);
      await new Promise(setTimeout);
    }

    // Write them all out, in one multiset operation.
    storage.multiSet(writes.map(([key, value]) => [createStorageKey(key), value]));

    // Record success.
    lastWrittenState = state;
  }

  function passWhitelistBlacklist (key) {
    if (whitelist && whitelist.indexOf(key) === -1) return false
    if (blacklist.indexOf(key) !== -1) return false
    return true
  }

  function adhocRehydrate (incoming, options = {}) {
    let state = {}
    if (options.serial) {
      stateIterator(incoming, (subState, key) => {
        try {
          let data = deserializer(subState)
          let value = transforms.reduceRight((interState, transformer) => {
            return transformer.out(interState, key)
          }, data)
          state = stateSetter(state, key, value)
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.warn(`Error rehydrating data for key "${key}"`, subState, err)
        }
      })
    } else state = incoming

    store.dispatch(rehydrateAction(state))
    return state
  }

  function createStorageKey (key) {
    return `${keyPrefix}${key}`
  }

  // return `persistor`
  return {
    rehydrate: adhocRehydrate,
    pause: () => { paused = true },
    resume: () => { paused = false },
    purge: (keys) => purgeStoredState({storage, keyPrefix}, keys),

    // Only used in `persistStore`, to force `lastState` to update
    // with the results of `REHYDRATE` even when the persistor is
    // paused.
    _resetLastState: () => { lastState = store.getState() }
  }
}

function warnIfSetError (key) {
  return function setError (err) {
    if (err && process.env.NODE_ENV !== 'production') { console.warn('Error storing data for key:', key, err) }
  }
}

function defaultSerializer (data) {
  return stringify(data, null, null, (k, v) => {
    if (process.env.NODE_ENV !== 'production') return null
    throw new Error(`
      redux-persist: cannot process cyclical state.
      Consider changing your state structure to have no cycles.
      Alternatively blacklist the corresponding reducer key.
      Cycle encounted at key "${k}" with value "${v}".
    `)
  })
}

function defaultDeserializer (serial) {
  return JSON.parse(serial)
}

function rehydrateAction (data) {
  return {
    type: REHYDRATE,
    payload: data
  }
}

function defaultStateIterator (collection, callback) {
  return Object.keys(collection).forEach((key) => callback(collection[key], key))
}

function defaultStateGetter (state, key) {
  return state[key]
}

function defaultStateSetter (state, key, value) {
  state[key] = value
  return state
}
