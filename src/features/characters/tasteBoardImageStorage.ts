const DATABASE_NAME = 'introduce-taste-board-images';
const STORE_NAME = 'images';
const DATABASE_VERSION = 1;

export interface TasteBoardImageStorage {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
  listIds(): Promise<string[]>;
  protect(id: string): void;
  unprotect(id: string): void;
  prune(referencedIds: ReadonlySet<string>): Promise<void>;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted'));
  });
}

export function createTasteBoardImageStorage(factory: IDBFactory | undefined = globalThis.indexedDB, databaseName = DATABASE_NAME): TasteBoardImageStorage {
  let databasePromise: Promise<IDBDatabase> | undefined;
  const protectedIds = new Set<string>();
  const openDatabase = () => {
    if (!databasePromise) {
      databasePromise = new Promise((resolve, reject) => {
        if (!factory) {
          reject(new Error('IndexedDB is unavailable'));
          return;
        }
        const request = factory.open(databaseName, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB is unavailable'));
        request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked'));
      });
    }
    return databasePromise;
  };

  const withStore = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => Promise<T>): Promise<T> => {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, mode);
    const done = transactionDone(transaction);
    try {
      const result = await operation(transaction.objectStore(STORE_NAME));
      await done;
      return result;
    } catch (error) {
      try { transaction.abort(); } catch { /* The transaction may already be inactive. */ }
      throw error;
    }
  };

  return {
    put: (id, blob) => withStore('readwrite', async store => { await requestResult(store.put(blob, id)); }),
    get: id => withStore('readonly', async store => (await requestResult(store.get(id))) ?? null),
    delete: id => withStore('readwrite', async store => { await requestResult(store.delete(id)); }),
    listIds: () => withStore('readonly', async store => (await requestResult(store.getAllKeys())).map(String)),
    protect: id => { protectedIds.add(id); },
    unprotect: id => { protectedIds.delete(id); },
    prune: referencedIds => withStore('readwrite', async store => {
      const keys = await requestResult(store.getAllKeys());
      await Promise.all(keys.filter(key => !referencedIds.has(String(key)) && !protectedIds.has(String(key))).map(key => requestResult(store.delete(key))));
    }),
  };
}

export function collectTasteBoardImageIds(board: { groups: Array<{ cells: Array<{ imageId?: string } | null> }> }, history: Array<{ groups: Array<{ cells: Array<{ imageId?: string } | null> }> }> = []): Set<string> {
  const ids = new Set<string>();
  for (const document of [board, ...history]) {
    for (const group of document.groups) {
      for (const cell of group.cells) if (cell?.imageId) ids.add(cell.imageId);
    }
  }
  return ids;
}
