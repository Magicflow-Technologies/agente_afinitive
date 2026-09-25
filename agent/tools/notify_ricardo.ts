import { defineTool } from "eve/tools";
import { z } from "zod";
import { getWhatsAppTemplateConfig } from "../lib/templates.js";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo (+51942900456) informando sobre un nuevo lead calificado usando la plantilla configurada en el sistema.",
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
  }),
  async execute({ leadName, leadPhone, interestSummary, proposedSlot }) {
    const ricardoPhone = process.env.RICARDO_PHONE_NUMBER || "+51942900456";
    const crmCallbackUrl =
      process.env.CRM_CALLBACK_URL ||
      (process.env.CRM_API_URL
        ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
        : "https://crm.afinitive.com.pe/api/webhooks/eve-response");
    const crmApiKey = process.env.CRM_API_KEY || "";

    const { templateName, templateLanguage, defaultVariables } =
      getWhatsAppTemplateConfig();

    const payload = {
      to: ricardoPhone,
      template: templateName,
      language: templateLanguage,
      variables: defaultVariables,
      sessionId: "notif-ricardo",
    };

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
        const errText = await response.text().catch(() => "");
        throw new Error(
          `Error en CRM (${response.status}): ${errText || response.statusText}`
        );
      }

      return {
        success: true,
        sentTo: ricardoPhone,
        templateUsed: payload.template,
        language: payload.language,
        leadSummary: {
          leadName,
          leadPhone,
          interestSummary,
          proposedSlot,
        },
        status: `Notificación enviada exitosamente al WhatsApp de Ricardo usando la plantilla '${payload.template}' (${payload.language}).`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
