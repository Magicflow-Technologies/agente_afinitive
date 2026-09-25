import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo con el resumen del cliente potencial y opciones de decisión. Soporta plantilla de Meta o texto libre.",
  inputSchema: z.object({
    leadName: z.string().describe("Nombre del prospecto/cliente."),
    leadPhone: z.string().describe("Número de WhatsApp del prospecto."),
    interestSummary: z
      .string()
      .describe(
        "Resumen conciso del interés, evento al que asistió o dudas del cliente."
      ),
    proposedSlot: z
      .string()
      .describe(
        "Fecha y hora tentativa propuesta para la reunión (ej. 'Viernes 20 a las 10:00 AM')."
      ),
    useTemplate: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Si es true, envía el mensaje usando la plantilla oficial de Meta para abrir la ventana de 24h."
      ),
    templateName: z
      .string()
      .optional()
      .default("hello_world")
      .describe("Nombre de la plantilla de Meta (ej. 'hello_world')."),
    templateLanguage: z
      .string()
      .optional()
      .default("en_US")
      .describe(
        "Código de idioma de la plantilla (ej. 'en_US', 'es_LA', 'es')."
      ),
  }),
  async execute({
    leadName,
    leadPhone,
    interestSummary,
    proposedSlot,
    useTemplate,
    templateName,
    templateLanguage,
  }) {
    const ricardoPhone = process.env.RICARDO_PHONE_NUMBER || "+51942900456";
    const crmCallbackUrl =
      process.env.CRM_CALLBACK_URL ||
      (process.env.CRM_API_URL
        ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
        : "https://crm.afinitive.com.pe/api/webhooks/eve-response");
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

    const payload: Record<string, any> = {
      to: ricardoPhone,
      sessionId: "notif-ricardo",
    };

    if (useTemplate) {
      payload.template = templateName || "hello_world";
      payload.language = templateLanguage || "en_US";
    } else {
      payload.reply = notificationMessage;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (crmApiKey) {
        headers["Authorization"] = `Bearer ${crmApiKey}`;
      }

      const response = await fetch(crmCallbackUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Error en CRM (${response.status}): ${response.statusText}`
        );
      }

      return {
        success: true,
        sentTo: ricardoPhone,
        mode: useTemplate ? "template" : "direct_reply",
        messageFormatted: notificationMessage,
        status: "Notificación enviada al WhatsApp de Ricardo exitosamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
