import { defineTool } from "eve/tools";
import { z } from "zod";
import { getWhatsAppTemplateConfig } from "../lib/templates.js";

export default defineTool({
  description:
    "Envía un mensaje de plantilla oficial de Meta WhatsApp para iniciar una conversación fuera de la ventana de 24 horas.",
  inputSchema: z.object({
    to: z
      .string()
      .describe(
        "Número de teléfono de destino con código de país (ej. '+51942900456')."
      ),
    template: z
      .string()
      .optional()
      .describe(
        "Nombre de la plantilla de Meta (opcional, usa WHATSAPP_TEMPLATE_NAME por defecto)."
      ),
    language: z
      .string()
      .optional()
      .describe(
        "Código de idioma de la plantilla (opcional, usa WHATSAPP_TEMPLATE_LANGUAGE por defecto)."
      ),
    variables: z
      .array(z.string())
      .optional()
      .describe(
        "Lista de variables {{1}}, etc. si la plantilla las requiere."
      ),
    sessionId: z.string().optional().describe("ID de sesión o trazabilidad."),
  }),
  async execute({ to, template, language, variables, sessionId }) {
    const crmCallbackUrl =
      process.env.CRM_CALLBACK_URL ||
      (process.env.CRM_API_URL
        ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
        : "https://crm.afinitive.com.pe/api/webhooks/eve-response");
    const crmApiKey = process.env.CRM_API_KEY || "";

    const config = getWhatsAppTemplateConfig();

    const payload: Record<string, any> = {
      to,
      template: template || config.templateName,
      language: language || config.templateLanguage,
      sessionId: sessionId || "template-dispatch",
    };
    if (variables && variables.length > 0) {
      payload.variables = variables;
    } else if (!template || template === config.templateName) {
      payload.variables = config.defaultVariables;
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
          `Error al enviar plantilla WhatsApp (${response.status}): ${
            errText || response.statusText
          }`
        );
      }

      return {
        success: true,
        sentTo: to,
        template: payload.template,
        language: payload.language,
        status: "Plantilla oficial de WhatsApp despachada exitosamente.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
