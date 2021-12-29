// @flow strict-local
import {
  openDatabase,
  type SQLResultSet,
  type WebSQLDatabase,
  type SQLTransaction as WebSQLTransaction,
} from 'expo-sqlite';
import invariant from 'invariant';

/* eslint-disable no-use-before-define */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-void */

/* eslint-disable-next-line flowtype/type-id-match */
type SQLArgument = number | string;

export class SQLDatabase {
  db: WebSQLDatabase;

  constructor(name: string) {
    this.db = openDatabase(name);
  }

  transaction(cb: SQLTransaction => void | Promise<void>): Promise<void> {
    return new Promise((resolve, reject) =>
      this.db.transaction(
        tx => void keepQueueLiveWhile(tx, () => cb(new SQLTransactionImpl(this, tx))),
        reject,
        resolve,
      ),
    );
  }

  readTransaction(cb: SQLTransaction => void | Promise<void>): Promise<void> {
    return new Promise((resolve, reject) =>
      this.db.readTransaction(
        tx => void keepQueueLiveWhile(tx, () => cb(new SQLTransactionImpl(this, tx))),
        reject,
        resolve,
      ),
    );
  }

  /**
   * Convenience method for a single read-only query.
   *
   * Warning: nothing checks that the returned rows actually match the given
   * Row type.  The actual rows will be objects keyed on the column names in
   * the query.  For effective type-checking, always pass a type parameter
   * that matches the query.  For example:
   *   db.query<{ foo: number, bar: string }>('SELECT foo, bar FROM stuff');
   */
  async query<Row: { ... } = { ... }>(
    statement: string,
    args?: $ReadOnlyArray<SQLArgument>,
  ): Promise<Row[]> {
    let p: void | Promise<Row[]> = undefined;
    await this.readTransaction(tx => {
      p = tx.executeSql(statement, args).then(r => r.rows._array);
    });
    invariant(p, 'transaction finished; statement promise should be initialized');
    return p;
  }
}

// An absurd little workaround for expo-sqlite, or really
// the @expo/websql library under it, being too eager to check a
// transaction's queue and declare it complete.
//
// Also for it not handling errors in callbacks, so that an exception in a
// transaction's application-level code causes it to commit (!) if the
// transaction callback itself throws an exception, and to get the whole
// database object stuck if a statement callback throws an exception.
// Instead, on any such exception we cause the transaction to roll back.
async function keepQueueLiveWhile(tx: WebSQLTransaction, f: () => void | Promise<void>) {
  let error = false;
  let done = false;
  const hold = () =>
    tx.executeSql('SELECT 1', [], () =>
      error ? tx.executeSql('SELECT error') : done ? undefined : hold(),
    );
  hold();
  try {
    await f();
  } catch (e) {
    error = true;
  } finally {
    done = true;
  }

  // A neat touch would be to pass through the actual error message.
  // Sadly `tx.executeSql('SELECT ?, error', [String(error)])` doesn't
  // produce any hint of the string; the resulting message is just
  //   SQLITE_ERROR: no such column: error
  // So, encode the error string as a SQL identifier?  (With a prefix
  // to ensure it doesn't hit a builtin, or reserved word?)  Need to
  // be darn sure the encoding is correct and doesn't cause injection.
  //
  // For now, we content ourselves with aborting the transaction at all.
}

class SQLTransactionImpl {
  db: SQLDatabase;
  tx: WebSQLTransaction;

  constructor(db: SQLDatabase, tx: WebSQLTransaction) {
    this.db = db;
    this.tx = tx;
  }

  executeSql(statement: string, args?: $ReadOnlyArray<SQLArgument>): Promise<SQLResultSet> {
    return new Promise((resolve, reject) => {
      this.tx.executeSql(
        statement,
        args,
        (t, r) => resolve(r),
        (t, e) => {
          reject(e);
          return true; // true means propagate the error and roll back the transaction
        },
      );
    });
  }
}

/* eslint-disable-next-line flowtype/type-id-match */
export type SQLTransaction = SQLTransactionImpl;
