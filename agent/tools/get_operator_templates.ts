import { defineTool } from "eve/tools";
import { z } from "zod";
import { operatorFetch } from "../lib/operator.js";

export default defineTool({
  description:
    "Obtiene el listado de plantillas de correo disponibles en el Sistema Operador.",
  inputSchema: z.object({}),
  async execute() {
    try {
      const data = await operatorFetch("/api/agent/plantillas", {
        method: "GET",
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
