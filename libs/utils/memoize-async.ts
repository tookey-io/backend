import stableStringify from "fast-json-stable-stringify";
import memoize from "fast-memoize";

// A bit of a hack
interface CacheArgsAndHash { args: any[], hash: string }

// Since has/get/set are unavoidably synchronous, and since 
// there is no synchronous test for Promise state, we leverage 
// the returned promise to perform the test and retry if necessary.  
// This also lets multiple initial attempts during the pending 
// phase to share the result.  Rejected attempts are not retried, 
// but later attempts will see the rejection and attempt the cache *that*.
class PromiseAwareMemoizingCache<T extends (...args: any[]) => any> {
  private store: { [key : string]: any } = {};

  constructor(private fn : T) { }

  has = (argsAndHash : CacheArgsAndHash) => {
    return argsAndHash.hash in this.store;
  }

  get = (argsAndHash : CacheArgsAndHash) => {
    const cached = this.store[argsAndHash.hash];

    if (typeof cached === "object" && typeof cached.then === "function") { // Test for a promise
      let handled = false;

      // a race between a first possibly-pending Promise
      // and a certainly-resolved second Promise.  (First
      // position does get precedence)
      const cachedOrRetry = Promise.race([
        // if `cached` is immediately resolved, it will
        // win the race and be what is returned by this
        // invocation of `get()`.  If it is pending but
        // ultimately resolves, it will be ignored here
        // because it will already have been returned by
        // the second position logic.
        cached.catch(() => {
          // If `cached` is *immediately* rejected (it
          // is the cached promise from a previous
          // call which ultimately rejected) then
          // store and return a retry of the same call
          // instead of the cached rejection.  But if
          // `cached` was immediately pending, then
          // `handled` would be set and we should
          // ignore this ultimate late rejection.
          if (!handled) {
            const retry = this.store[argsAndHash.hash] = this.fn(...argsAndHash.args);
            return retry;
          }
        }),
        Promise.resolve().then(() => {
          // If this second position Promise wins the
          // race, it means the first was pending.
          // This handler will be run either way, but
          // the returned value will be ignored if we lost.
          // Assuming we won and the cached promise is
          // pending, mark this particular `get()`
          // invocation handled so that if it
          // ultimately fails we don't retry the
          // request.
          handled = true;
          // return the cached promise which will only
          // be returned by this invocation of `get()`
          // if it is pending.
          return cached;
        })
      ]);
      return cachedOrRetry;
    } else { // `undefined` (not found), or some other non-Promise memoized value
      return cached;
    }
  }

  set = (argsAndHash : CacheArgsAndHash, value : any) => {
    this.store[argsAndHash.hash] = value;
  }
}

// Memoizes a fetcher function (not necessarily production-ready)
export const memoizeAsync = <T extends (...args: any[]) => any>(fn : T) : T => {
  return memoize<T>(
    fn,
    {
      // The typescript types, at least, expect a string.  
      // Hacking it here, because we need the original args.
      // We could deserialize the stringified args, 
      // but this seems a little nicer.
      serializer: args => ({ args, hash: stableStringify(args) } as any), //hack
      cache: {
        create: () => new PromiseAwareMemoizingCache<T>(fn)
      } as any // Something wrong with the typescript types here related to cache.create()
    }
  );
};