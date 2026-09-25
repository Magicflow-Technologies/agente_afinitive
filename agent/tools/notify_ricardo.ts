import { defineTool } from "eve/tools";
import { z } from "zod";
import { getWhatsAppTemplateConfig } from "../lib/templates.js";
import { setPendingLead } from "../lib/pending_leads.js";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo (+51942900456) informando sobre un nuevo lead calificado y registrándolo en espera de confirmación.",
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
        "Fecha y hora tentativa propuesta para la reunión (ej. 'Sábado 26 a las 5:00 PM')."
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

    // Guardar el lead en memoria para que cuando Ricardo responda, el agente sepa quién es
    setPendingLead({
      leadName,
      leadPhone,
      interestSummary,
      proposedSlot,
      timestamp: new Date().toISOString(),
    });

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
        status: `Notificación enviada a Ricardo exitosamente con la plantilla '${payload.template}'. Lead registrado en espera de su respuesta.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
