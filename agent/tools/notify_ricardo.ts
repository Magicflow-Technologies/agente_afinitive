import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo usando obligatoriamente la plantilla oficial de Meta ('hello_world') para garantizar la entrega fuera de la ventana de 24h.",
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
    templateName: z
      .string()
      .optional()
      .default("hello_world")
      .describe("Nombre de la plantilla de Meta (por defecto: 'hello_world')."),
    templateLanguage: z
      .string()
      .optional()
      .default("en_US")
      .describe(
        "Código de idioma de la plantilla (por defecto: 'en_US')."
      ),
    variables: z
      .array(z.string())
      .optional()
      .describe("Variables posicionales de la plantilla si las requiere."),
  }),
  async execute({
    leadName,
    leadPhone,
    interestSummary,
    proposedSlot,
    templateName,
    templateLanguage,
    variables,
  }) {
    const ricardoPhone = process.env.RICARDO_PHONE_NUMBER || "+51942900456";
    const crmCallbackUrl =
      process.env.CRM_CALLBACK_URL ||
      (process.env.CRM_API_URL
        ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
        : "https://crm.afinitive.com.pe/api/webhooks/eve-response");
    const crmApiKey = process.env.CRM_API_KEY || "";

    // Payload obligatorio en modo plantilla para cumplir con la política de 24h de Meta
    const payload: Record<string, any> = {
      to: ricardoPhone,
      template: templateName || "hello_world",
      language: templateLanguage || "en_US",
      sessionId: "notif-ricardo",
    };

    if (variables && variables.length > 0) {
      payload.variables = variables;
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
        leadContext: {
          name: leadName,
          phone: leadPhone,
          interest: interestSummary,
          slot: proposedSlot,
        },
        status:
          "Plantilla oficial 'hello_world' enviada exitosamente a Ricardo vía WhatsApp.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
