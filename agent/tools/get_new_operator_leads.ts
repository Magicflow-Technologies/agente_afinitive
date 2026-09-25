import { defineTool } from "eve/tools";
import { z } from "zod";
import { operatorFetch } from "../lib/operator.js";

export default defineTool({
  description:
    "Consulta los clientes o leads nuevos registrados recientemente (Bio-Link TikTok, Landings, etc.) para saber qué acción comercial tomar.",
  inputSchema: z.object({
    estado: z
      .string()
      .default("pendiente")
      .describe("Estado de los prospectos a filtrar (default: 'pendiente')."),
    limite: z
      .number()
      .int()
      .positive()
      .default(10)
      .describe("Cantidad máxima de leads a consultar (default: 10)."),
  }),
  async execute({ estado, limite }) {
    try {
      const data = await operatorFetch("/api/agent/clientes/nuevos", {
        method: "GET",
        params: { estado, limite },
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
