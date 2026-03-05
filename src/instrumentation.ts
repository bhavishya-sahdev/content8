export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js v22+ ships a partial `localStorage` global that exists but has
    // no working methods. Prism.js (via react-syntax-highlighter) calls
    // localStorage.getItem() during module init, crashing SSR on Node v22+.
    // Removing it lets any guards like `typeof localStorage !== "undefined"` fail
    // gracefully, same as older Node versions.
    const g = globalThis as Record<string, unknown>;
    if (
      typeof g["localStorage"] !== "undefined" &&
      typeof (g["localStorage"] as Storage)?.getItem !== "function"
    ) {
      delete g["localStorage"];
    }
  }
}
