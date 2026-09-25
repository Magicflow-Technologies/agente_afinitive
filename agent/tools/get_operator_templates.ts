import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Obtiene el listado de plantillas de correo disponibles en el Sistema Operador.",
  inputSchema: z.object({}),
  async execute() {
    const operatorApiBaseUrl =
      process.env.OPERATOR_API_BASE_URL || "https://api.operador.afinitive.com";
    const operatorApiKey = process.env.OPERATOR_API_KEY || "";

    const url = new URL("/api/agent/plantillas", operatorApiBaseUrl);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (operatorApiKey) {
        headers["Authorization"] = `Bearer ${operatorApiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Error al consultar plantillas en Operador (${response.status}): ${response.statusText}`
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
