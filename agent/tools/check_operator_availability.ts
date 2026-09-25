import { defineTool } from "eve/tools";
import { z } from "zod";
import { operatorFetch } from "../lib/operator.js";

export default defineTool({
  description:
    "Consulta los días y horas disponibles en la agenda de Google Calendar de Ricardo (Hora de Perú UTC-5). Permite ver slots libres para agendar reuniones.",
  inputSchema: z.object({
    dias: z
      .number()
      .int()
      .positive()
      .default(7)
      .describe(
        "Número de días hacia adelante a consultar disponibilidad (por defecto 7)."
      ),
    fecha: z
      .string()
      .optional()
      .describe(
        "Fecha específica a consultar en formato YYYY-MM-DD (ej: '2026-09-25')."
      ),
  }),
  async execute({ dias, fecha }) {
    try {
      const data = await operatorFetch("/api/agent/agenda/disponibilidad", {
        method: "GET",
        params: { dias, fecha },
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
