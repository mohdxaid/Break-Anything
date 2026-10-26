# Architecture
The fuzzer uses standard `fetch` with `Promise.allSettled` to trigger concurrent race conditions.