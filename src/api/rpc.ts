import { Hono } from "hono";

import { logger } from "@/lib/logger";

import { dispatch } from "./rpc-dispatcher";

const api = new Hono();

/**
 * RPC Endpoint - Single entry point for all service calls
 *
 * Example request:
 * POST /api/rpc
 * {
 *   "method": "FacetEnvVars.getByFacet",
 *   "params": { "facetName": "claudia" }
 * }
 */
api.post("/", async (c) => {
  try {
    const command = await c.req.json();

    // Log the RPC call
    logger.debug(
      { method: command.method, params: command.params },
      "RPC call",
    );

    // Dispatch to service
    const response = await dispatch(command);

    if (response.success) {
      return c.json(response, 200);
    }

    // Business logic error
    logger.warn({ error: response.error, method: command.method }, "RPC error");
    return c.json(response, 400);
  } catch (error) {
    // Unexpected error (parsing, etc)
    logger.error({ error }, "RPC handler error");
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { api };
