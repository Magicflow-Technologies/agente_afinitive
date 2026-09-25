import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveLead } from "../lib/pending_leads.js";

export default defineTool({
  description:
    "Envía un mensaje de respuesta o confirmación directamente al WhatsApp del cliente/prospecto en nombre de Ricardo o de Afinitive.",
  inputSchema: z.object({
    leadPhone: z
      .string()
      .describe(
        "Número de WhatsApp del cliente con código de país (ej. '+51987654321')."
      ),
    message: z
      .string()
      .describe(
        "Mensaje redactado con cortesía, empatía y claridad para el cliente."
      ),
  }),
  async execute({ leadPhone, message }) {
    const crmCallbackUrl =
      process.env.CRM_CALLBACK_URL ||
      (process.env.CRM_API_URL
        ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
        : "https://crm.afinitive.com.pe/api/webhooks/eve-response");
    const crmApiKey = process.env.CRM_API_KEY || "";

    const payload = {
      to: leadPhone,
      reply: message,
      sessionId: "reply-from-ricardo",
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

      // Guardar el registro de la interacción sin borrar el lead
      saveLead({
        leadPhone,
        notes: `Último mensaje enviado al cliente: ${message}`,
      });

      return {
        success: true,
        sentTo: leadPhone,
        messageTransmitted: message,
        status: `Mensaje transmitido exitosamente al WhatsApp del cliente (${leadPhone}).`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

