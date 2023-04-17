export function retry<T>(fn: () => Promise<T>, count = 100, timeout = 200): Promise<T> {
  return new Promise<T>(async (resolve) => {
    while (true) {
      const result: T | null = await fn().catch(() => null);
      if (result) {
        resolve(result);
        break;
      } else {
        if (count <= 0) {
          resolve(null);
          break;
        }
        count -= 1;
        await wait(timeout);
      }
    }
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
