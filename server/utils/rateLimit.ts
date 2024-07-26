export type RateLimitOptions = {
  maxRPS: number;
  id?: string;
};

type RateLimiteState<T extends (...args: Parameters<T>) => Promise<U>, U> = {
  queue: {
    args: Parameters<T>;
    resolve: (value: U) => void;
    reject: (reason?: unknown) => void;
  }[];
  lastTimestamps: number[];
  timeout: ReturnType<typeof setTimeout>;
};

const rateLimitById: Record<string, unknown> = {};

/**
 * Add a rate limit to a function so it doesn't exceed a maximum number of requests per second. Function calls exceeding the rate will be delayed.
 * @param fn The function to rate limit
 * @param options.maxRPS Maximum number of Requests Per Second
 * @param options.id An ID to share between rate limits, so it uses the same request queue.
 * @returns The function with a rate limit
 */
export default function rateLimit<
  T extends (...args: Parameters<T>) => Promise<U>,
  U
>(fn: T, options: RateLimitOptions): (...args: Parameters<T>) => Promise<U> {
  const state: RateLimiteState<T, U> = (rateLimitById[
    options.id || ''
  ] as RateLimiteState<T, U>) || { queue: [], lastTimestamps: [] };
  if (options.id) {
    rateLimitById[options.id] = state;
  }

  const processQueue = () => {
    // remove old timestamps
    state.lastTimestamps = state.lastTimestamps.filter(
      (timestamp) => Date.now() - timestamp < 1000
    );

    if (state.lastTimestamps.length < options.maxRPS) {
      // process requests if RPS not exceeded
      const item = state.queue.shift();
      if (!item) return;
      state.lastTimestamps.push(Date.now());
      const { args, resolve, reject } = item;
      fn(...args)
        .then(resolve)
        .catch(reject);
      processQueue();
    } else {
      // rerun once the oldest item in queue is older than 1s
      if (state.timeout) clearTimeout(state.timeout);
      state.timeout = setTimeout(
        processQueue,
        1000 - (Date.now() - state.lastTimestamps[0])
      );
    }
  };

  return (...args: Parameters<T>): Promise<U> => {
    return new Promise<U>((resolve, reject) => {
      state.queue.push({ args, resolve, reject });
      processQueue();
    });
  };
}
