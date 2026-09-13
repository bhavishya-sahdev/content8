export async function checkImageExists(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return (
      response.ok && response.headers.get("content-type")?.startsWith("image/")
    );
  } catch {
    return false;
  }
}
