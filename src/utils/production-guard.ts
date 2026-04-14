// Disable non-essential console messages in production to reduce noise and potential data leaks
// This is intentionally conservative: only non-critical logs are silenced
if (import.meta.env.PROD) {
  // Save original functions in case you want to re-enable during debugging
  const noop = () => {};
  // @ts-expect-error - Intentionally silencing debug logs in production
  console.debug = noop;
  // @ts-expect-error - Intentionally silencing logs in production
  console.log = noop;
  // @ts-expect-error - Intentionally silencing info logs in production
  console.info = noop;
  // Do not silence console.error to ensure critical issues are visible in logs
}
