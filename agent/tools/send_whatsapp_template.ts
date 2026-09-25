import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Envía un mensaje de plantilla oficial de Meta WhatsApp (WhatsApp Template) para iniciar una conversación o contactar a un cliente o administrador fuera de la ventana de 24 horas.",
  inputSchema: z.object({
    to: z
      .string()
      .describe(
        "Número de teléfono de destino con código de país (ej. '+51942900456')."
      ),
    template: z
      .string()
      .default("confirmacin_de_registro_de_inyeccin_en_calendario2026")
      .describe(
        "Nombre de la plantilla registrada en Meta (ej. 'confirmacin_de_registro_de_inyeccin_en_calendario2026')."
      ),
    language: z
      .string()
      .default("es_PE")
      .describe(
        "Código de idioma de la plantilla (por defecto: 'es_PE')."
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

    const payload: Record<string, any> = {
      to,
      template:
        template || "confirmacin_de_registro_de_inyeccin_en_calendario2026",
      language: language || "es_PE",
      sessionId: sessionId || "template-dispatch",
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
