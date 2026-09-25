import { defineTool } from "eve/tools";
import { z } from "zod";
import { operatorFetch } from "../lib/operator.js";

export default defineTool({
  description:
    "Crea y agenda una reunión en Google Calendar con o sin sala de Google Meet y opción de enviar correo de confirmación al cliente.",
  inputSchema: z.object({
    titulo: z
      .string()
      .describe(
        "Título del evento en el calendario (ej. 'Sesión de Asesoría Patrimonial - Carlos Pérez')."
      ),
    tipo_reunion: z
      .enum(["con_meet", "recordatorio"])
      .default("con_meet")
      .describe(
        "Tipo de reunión: 'con_meet' (con sala de Google Meet) o 'recordatorio' (llamada o recordatorio sin Meet)."
      ),
    fecha_inicio: z
      .string()
      .describe(
        "Fecha y hora de inicio en formato ISO 8601 (ej. '2026-09-25T15:00:00.000Z')."
      ),
    duracion_minutos: z
      .number()
      .int()
      .positive()
      .default(45)
      .describe("Duración en minutos de la reunión (default: 45)."),
    cliente_nombre: z.string().describe("Nombre completo del cliente prospecto."),
    cliente_email: z
      .string()
      .optional()
      .describe("Correo electrónico del cliente."),
    cliente_telefono: z
      .string()
      .optional()
      .describe("Teléfono de WhatsApp del cliente."),
    descripcion: z
      .string()
      .optional()
      .describe("Notas o resumen de los temas a tratar en la reunión."),
    enviar_correo_confirmacion: z
      .boolean()
      .default(true)
      .describe(
        "Indica si se envía automáticamente el correo de confirmación al cliente."
      ),
  }),
  async execute(input) {
    try {
      const data = await operatorFetch("/api/agent/agenda/crear-reunion", {
        method: "POST",
        body: input,
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
