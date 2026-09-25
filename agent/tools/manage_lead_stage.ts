import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Actualiza o consulta el estado del lead, notas y la bandera de modo_humano en el sistema.",
  inputSchema: z.object({
    leadPhone: z.string().describe("Teléfono del lead."),
    stage: z
      .enum([
        "NUEVO",
        "INVITADO_EVENTO",
        "POST_EVENTO",
        "CALIFICADO",
        "ESPERANDO_APROBACION_RICARDO",
        "AGENDADO",
        "DESCARTADO",
      ])
      .optional()
      .describe("Nueva etapa del embudo a asignar al lead."),
    modoHumano: z
      .boolean()
      .optional()
      .describe("Si es true, la IA se pausa y no responderá más en este chat hasta que se reactive."),
    notes: z
      .string()
      .optional()
      .describe("Notas o resumen de la interacción con el cliente."),
  }),
  async execute({ leadPhone, stage, modoHumano, notes }) {
    const operatorApiBaseUrl = process.env.OPERATOR_API_BASE_URL || "";
    const operatorApiKey = process.env.OPERATOR_API_KEY || "";

    try {
      if (operatorApiBaseUrl) {
        await fetch(`${operatorApiBaseUrl}/api/leads/stage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${operatorApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ leadPhone, stage, modoHumano, notes }),
        });
      }

      return {
        success: true,
        leadPhone,
        updatedStage: stage,
        modoHumano: modoHumano ?? false,
        notes,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
