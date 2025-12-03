import { Hono } from "hono";
import { api as rpcRoutes } from "./rpc";

const api = new Hono();

api.route("/rpc", rpcRoutes);

export default api;
