import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo con el resumen del cliente potencial, horario sugerido y las 3 opciones de decisión.",
  inputSchema: z.object({
    leadName: z.string().describe("Nombre del prospecto/cliente."),
    leadPhone: z.string().describe("Número de WhatsApp del prospecto."),
    interestSummary: z
      .string()
      .describe("Resumen conciso del interés, evento al que asistió o dudas del cliente."),
    proposedSlot: z
      .string()
      .describe("Fecha y hora tentativa propuesta para la reunión (ej. 'Viernes 20 a las 10:00 AM')."),
  }),
  async execute({ leadName, leadPhone, interestSummary, proposedSlot }) {
    const ricardoPhone = process.env.RICARDO_PHONE_NUMBER || "+51942900456";
    const crmApiUrl = process.env.CRM_API_URL || "";
    const crmApiKey = process.env.CRM_API_KEY || "";

    const notificationMessage = [
      `🔔 *Nuevo Cliente Potencial Calificado*`,
      ``,
      `👤 *Contacto:* ${leadName} (${leadPhone})`,
      `📌 *Interés:* ${interestSummary}`,
      `⏰ *Preferencia / Horario Propuesto:* ${proposedSlot}`,
      ``,
      `*¿Cómo procedemos?*`,
      `1️⃣ Responde *'1'* o *'Agendar'* para que yo cierre la reunión con Google Meet y le envíe la confirmación.`,
      `2️⃣ Responde *'2'* o *'Hablo yo'* si prefieres tomar tú el control del chat.`,
      `3️⃣ Escríbeme cualquier instrucción y se la responderé directamente al cliente.`,
    ].join("\n");

    try {
      if (crmApiUrl) {
        await fetch(`${crmApiUrl}/api/messages/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${crmApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: ricardoPhone,
            message: notificationMessage,
          }),
        });
      }

      return {
        success: true,
        sentTo: ricardoPhone,
        messageFormatted: notificationMessage,
        status: "Notificación enviada a Ricardo exitosamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
