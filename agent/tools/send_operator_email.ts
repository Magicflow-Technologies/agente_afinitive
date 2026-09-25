import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Envía correos comerciales al cliente utilizando las plantillas diseñadas en el Sistema Operador con reemplazo de variables.",
  inputSchema: z.object({
    plantilla_nombre: z
      .string()
      .describe(
        "Nombre/código identificador de la plantilla (ej. 'dr-finanzas', 'bienvenida', etc.)."
      ),
    destinatario_nombre: z
      .string()
      .describe("Nombre completo del destinatario."),
    destinatario_email: z
      .string()
      .describe("Correo electrónico del destinatario."),
    asunto_personalizado: z
      .string()
      .optional()
      .describe(
        "Asunto personalizado para el correo (opcional, sobrescribe el asunto de la plantilla)."
      ),
    variables: z
      .record(z.string(), z.any())
      .optional()
      .describe(
        "Objeto clave-valor con variables a reemplazar en la plantilla (ej: { propuesta: '...', calendario_link: '...' })."
      ),
    contenido_adicional: z
      .string()
      .optional()
      .describe(
        "Texto o mensaje complementario que se agregará al cuerpo del correo."
      ),
  }),
  async execute(input) {
    const operatorApiBaseUrl =
      process.env.OPERATOR_API_BASE_URL || "https://api.operador.afinitive.com";
    const operatorApiKey = process.env.OPERATOR_API_KEY || "";

    const url = new URL(
      "/api/agent/correos/enviar-plantilla",
      operatorApiBaseUrl
    );

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (operatorApiKey) {
        headers["Authorization"] = `Bearer ${operatorApiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(
          `Error al enviar correo en Operador (${response.status}): ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
