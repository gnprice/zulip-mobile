/* @flow strict-local */
// $FlowFixMe[untyped-import]
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

// The filename, presumably
const dbName = 'zulip.db';
// ??? what these three mean.
const dbVersion = '0.1';
const dbDisplayName = 'Zulip Database';
const dbSize = -1;

/* eslint-disable no-console */
/* eslint-disable no-use-before-define */

async function initDb() {
  console.log('initDb 0');
  await SQLite.echoTest();
  console.log('initDb 1');
  const db = await SQLite.openDatabase(dbName, dbVersion, dbDisplayName, dbSize);
  console.log('initDb 2');
  try {
    await db.executeSql('SELECT 1 FROM version LIMIT 1');
    console.log('initDb: ready!');
    return;
  } catch {
    console.log('initDb: not ready; initializing schema…');
    await populateDb(db);
  }
}

async function populateDb(db) {
  console.log('populateDb 0');
  await db.transaction(tx => {
    // TODO this needs a much better migration story!

    console.log('populateDb: DROP…');
    tx.executeSql('DROP TABLE IF EXISTS version');
    tx.executeSql('DROP TABLE IF EXISTS accounts');

    console.log('populateDb: CREATE…');
    tx.executeSql(`CREATE TABLE version (
        version INTEGER NOT NULL
    )`);
    tx.executeSql(`CREATE TABLE accounts (
        realm_url STRING NOT NULL,
        email STRING NOT NULL,
        user_id INTEGER,
        api_key STRING
        -- etc. more fields
    )`);

    console.log('populateDb: INSERT…');
    tx.executeSql('INSERT INTO version VALUES (1)');
  });
}

initDb();
