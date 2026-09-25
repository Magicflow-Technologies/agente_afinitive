/**
 * Configuración centralizada de plantillas de WhatsApp para el agente Afinitive.
 * Para cambiar la plantilla en el futuro, solo modifica las variables en .env o Vercel:
 * - WHATSAPP_TEMPLATE_NAME
 * - WHATSAPP_TEMPLATE_LANGUAGE
 */

export function getWhatsAppTemplateConfig() {
  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME ||
    process.env.RICARDO_NOTIFICATION_TEMPLATE ||
    "confirmacin_de_registro_de_inyeccin_en_calendario2026";

  const templateLanguage =
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || "es_PE";

  let defaultVariables = ["Ricardo"];
  if (process.env.WHATSAPP_TEMPLATE_VARIABLES) {
    try {
      const parsed = JSON.parse(process.env.WHATSAPP_TEMPLATE_VARIABLES);
      if (Array.isArray(parsed)) {
        defaultVariables = parsed;
      }
    } catch {
      defaultVariables = [process.env.WHATSAPP_TEMPLATE_VARIABLES];
    }
  }

  return {
    templateName,
    templateLanguage,
    defaultVariables,
  };
}
