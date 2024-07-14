export type RateLimitOptions = {
  maxRPS: number;
  id?: string;
};

type RateLimiteState<T extends (...args: Parameters<T>) => Promise<U>, U> = {
  queue: {
    args: Parameters<T>;
    resolve: (value: U) => void;
  }[];
  activeRequests: number;
  timer: NodeJS.Timeout | null;
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
  ] as RateLimiteState<T, U>) || { queue: [], activeRequests: 0, timer: null };
  if (options.id) {
    rateLimitById[options.id] = state;
  }

  const processQueue = () => {
    if (state.queue.length === 0) {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
      return;
    }

    while (state.activeRequests < options.maxRPS) {
      state.activeRequests++;
      const item = state.queue.shift();
      if (!item) break;
      const { args, resolve } = item;
      fn(...args)
        .then(resolve)
        .finally(() => {
          state.activeRequests--;
          if (state.queue.length > 0) {
            if (!state.timer) {
              state.timer = setInterval(processQueue, 1000);
            }
          } else {
            if (state.timer) {
              clearInterval(state.timer);
              state.timer = null;
            }
          }
        });
    }
  };

  return (...args: Parameters<T>): Promise<U> => {
    return new Promise<U>((resolve) => {
      state.queue.push({ args, resolve });
      processQueue();
    });
  };
}
