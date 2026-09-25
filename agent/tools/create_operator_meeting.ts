import { defineTool } from "eve/tools";
import { z } from "zod";
import { operatorFetch } from "../lib/operator.js";

export default defineTool({
  description:
    "Crea y agenda una reunión en Google Calendar con sala de Google Meet. IMPORTANTE: El correo del cliente (cliente_email) y la confirmación del horario son OBLIGATORIOS. No ejecutar si falta el correo del cliente.",
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
      .describe(
        "Correo electrónico OBLIGATORIO del cliente para enviar la invitación y enlace de Google Meet."
      ),
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
    if (!input.cliente_email || !input.cliente_email.includes("@")) {
      return {
        success: false,
        error:
          "El correo electrónico del cliente es obligatorio para agendar la reunión en Google Calendar. Solicita primero el correo al cliente antes de agendar.",
      };
    }

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

