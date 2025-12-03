import { services } from "./rpc-services.generated";
/**
 * RPC Command structure
 */
export interface RpcCommand {
  method: string; // "ServiceName.functionName"
  params: Record<string, unknown>;
}

/**
 * RPC Response structure
 */
export interface RpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Dispatch an RPC method call to the appropriate service function
 */
export async function dispatch(command: RpcCommand): Promise<RpcResponse> {
  const { method, params } = command;

  // Parse method: "ServiceName.functionName"
  const [serviceName, functionName] = method.split(".");

  if (!serviceName || !functionName) {
    return {
      success: false,
      error: `Invalid method format: ${method}. Expected "ServiceName.functionName"`,
    };
  }

  // Get service
  const service = services[serviceName as keyof typeof services];
  if (!service) {
    return {
      success: false,
      error: `Service not found: ${serviceName}`,
    };
  }

  // Get function
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic service dispatch requires runtime lookup
  const fn = (service as any)[functionName];
  if (typeof fn !== "function") {
    return {
      success: false,
      error: `Function not found: ${serviceName}.${functionName}`,
    };
  }

  try {
    // Call function with params object
    // For now, services receive params as a single object
    // We can evolve this to support positional args via reflection
    // The fn is responsible for validating params via Zod
    const result = await fn(params);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
