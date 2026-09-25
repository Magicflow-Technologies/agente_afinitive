import { defineTool } from "eve/tools";
import { z } from "zod";
import { operatorFetch } from "../lib/operator.js";

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
    try {
      const data = await operatorFetch("/api/agent/correos/enviar-plantilla", {
        method: "POST",
        body: input,
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
