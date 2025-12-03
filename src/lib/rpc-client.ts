export async function callRpc(command: {
  method: string;
  params: Record<string, unknown>;
}) {
  const response = await fetch("/api/rpc", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (response.ok) {
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }
  throw new Error(response.statusText);
}
