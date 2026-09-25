import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Consulta los días y horas disponibles en la agenda de Google Calendar de Ricardo (Hora de Perú UTC-5). Permite ver slots libres para agendar reuniones.",
  inputSchema: z.object({
    dias: z
      .number()
      .int()
      .positive()
      .default(7)
      .describe("Número de días hacia adelante a consultar disponibilidad (por defecto 7)."),
    fecha: z
      .string()
      .optional()
      .describe("Fecha específica a consultar en formato YYYY-MM-DD (ej: '2026-09-25')."),
  }),
  async execute({ dias, fecha }) {
    const operatorApiBaseUrl =
      process.env.OPERATOR_API_BASE_URL || "https://api.operador.afinitive.com";
    const operatorApiKey = process.env.OPERATOR_API_KEY || "";

    const url = new URL("/api/agent/agenda/disponibilidad", operatorApiBaseUrl);
    if (dias) url.searchParams.set("dias", String(dias));
    if (fecha) url.searchParams.set("fecha", fecha);

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
          `Error en API del Operador (${response.status}): ${response.statusText}`
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
