import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Envía una notificación al WhatsApp de Ricardo usando la plantilla oficial de Meta aprobada ('confirmacin_de_registro_de_inyeccin_en_calendario2026') para garantizar la entrega fuera de la ventana de 24h.",
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
      .default("confirmacin_de_registro_de_inyeccin_en_calendario2026")
      .describe(
        "Nombre de la plantilla de Meta (por defecto: 'confirmacin_de_registro_de_inyeccin_en_calendario2026')."
      ),
    templateLanguage: z
      .string()
      .optional()
      .default("es")
      .describe("Código de idioma de la plantilla (por defecto: 'es')."),
    variables: z
      .array(z.string())
      .optional()
      .default(["Ricardo"])
      .describe(
        "Variables {{1}}, etc. de la plantilla (por defecto: ['Ricardo'])."
      ),
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

    const template =
      templateName ||
      process.env.RICARDO_NOTIFICATION_TEMPLATE ||
      "confirmacin_de_registro_de_inyeccin_en_calendario2026";
    const language = templateLanguage || "es";
    const templateVars =
      variables && variables.length > 0 ? variables : ["Ricardo"];

    // Payload en modo plantilla oficial para Meta Cloud API
    const payload: Record<string, any> = {
      to: ricardoPhone,
      template,
      language,
      variables: templateVars,
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
        variablesUsed: payload.variables,
        leadContext: {
          name: leadName,
          phone: leadPhone,
          interest: interestSummary,
          slot: proposedSlot,
        },
        status: `Plantilla oficial '${payload.template}' enviada exitosamente a Ricardo vía WhatsApp.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
