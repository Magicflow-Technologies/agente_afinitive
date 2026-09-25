import { defineTool } from "eve/tools";
import { z } from "zod";

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
    const operatorApiBaseUrl =
      process.env.OPERATOR_API_BASE_URL || "https://api.operador.afinitive.com";
    const operatorApiKey = process.env.OPERATOR_API_KEY || "";

    const url = new URL("/api/agent/clientes/nuevos", operatorApiBaseUrl);
    if (estado) url.searchParams.set("estado", estado);
    if (limite) url.searchParams.set("limite", String(limite));

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (operatorApiKey) {
        headers["Authorization"] = `Bearer ${operatorApiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Error al consultar clientes nuevos en Operador (${response.status}): ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
