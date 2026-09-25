import { defineTool } from "eve/tools";
import { z } from "zod";
import { getWhatsAppTemplateConfig } from "../lib/templates.js";
import { saveLead } from "../lib/pending_leads.js";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo (+51942900456). Soporta tanto plantillas para iniciar contacto como mensajes de texto directos cuando ya hay conversación activa o se reportan datos del cliente (como su correo).",
  inputSchema: z.object({
    leadName: z.string().optional().describe("Nombre del prospecto/cliente."),
    leadPhone: z
      .string()
      .optional()
      .describe("Número de WhatsApp del prospecto."),
    email: z
      .string()
      .optional()
      .describe("Correo electrónico del prospecto si ya fue provisto."),
    interestSummary: z
      .string()
      .optional()
      .describe(
        "Resumen conciso del interés, evento al que asistió o dudas del cliente."
      ),
    proposedSlot: z
      .string()
      .optional()
      .describe(
        "Fecha y hora tentativa propuesta para la reunión (ej. 'Sábado 26 a las 5:00 PM')."
      ),
    directMessage: z
      .string()
      .optional()
      .describe(
        "Mensaje de texto directo para Ricardo (usar cuando se le reporta información, confirmaciones o el correo del cliente sin necesidad de plantilla)."
      ),
    useTemplate: z
      .boolean()
      .optional()
      .describe(
        "Si es true o si no hay directMessage, enviará la plantilla de WhatsApp configurada. Por defecto false si directMessage está presente."
      ),
  }),
  async execute({
    leadName,
    leadPhone,
    email,
    interestSummary,
    proposedSlot,
    directMessage,
    useTemplate,
  }) {
    const ricardoPhone = process.env.RICARDO_PHONE_NUMBER || "+51942900456";
    const crmCallbackUrl =
      process.env.CRM_CALLBACK_URL ||
      (process.env.CRM_API_URL
        ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
        : "https://crm.afinitive.com.pe/api/webhooks/eve-response");
    const crmApiKey = process.env.CRM_API_KEY || "";

    // Guardar / actualizar los datos del lead en memoria compartida
    if (leadPhone) {
      saveLead({
        leadName,
        leadPhone,
        email,
        interestSummary,
        proposedSlot,
        notes: directMessage,
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (crmApiKey) {
      headers["Authorization"] = `Bearer ${crmApiKey}`;
    }

    // Decidir si despachamos mensaje de texto directo o plantilla
    const shouldSendTemplate = useTemplate ?? !directMessage;

    try {
      if (shouldSendTemplate) {
        const { templateName, templateLanguage, defaultVariables } =
          getWhatsAppTemplateConfig();

        const payload = {
          to: ricardoPhone,
          template: templateName,
          language: templateLanguage,
          variables: defaultVariables,
          sessionId: "notif-ricardo",
        };

        const response = await fetch(crmCallbackUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(
            `Error en CRM plantilla (${response.status}): ${
              errText || response.statusText
            }`
          );
        }

        return {
          success: true,
          mode: "template",
          sentTo: ricardoPhone,
          templateUsed: payload.template,
          leadRegistered: {
            leadName,
            leadPhone,
            email,
            interestSummary,
            proposedSlot,
          },
          status: `Plantilla '${payload.template}' enviada a Ricardo exitosamente. Lead registrado en memoria.`,
        };
      } else {
        // Enviar mensaje de texto directo libre
        const payload = {
          to: ricardoPhone,
          reply: directMessage,
          sessionId: "direct-to-ricardo",
        };

        const response = await fetch(crmCallbackUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(
            `Error en CRM mensaje directo (${response.status}): ${
              errText || response.statusText
            }`
          );
        }

        return {
          success: true,
          mode: "direct_text",
          sentTo: ricardoPhone,
          messageSent: directMessage,
          leadRegistered: {
            leadName,
            leadPhone,
            email,
          },
          status: `Mensaje de texto directo enviado a Ricardo exitosamente.`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

