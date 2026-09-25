import { defineChannel, POST } from "eve/channels";
import { getPendingLead } from "../lib/pending_leads.js";

interface CrmWebhookPayload {
  from: string; // Número de WhatsApp del remitente (ej. +51987654321)
  message: string; // Contenido del mensaje recibido por WhatsApp
  name?: string; // Nombre del contacto si está registrado en el CRM
  leadId?: string; // ID interno del lead en el CRM
  secret?: string; // Token de seguridad opcional para validar el origen
}

export default defineChannel({
  turnPolicy: "queue",
  routes: [
    POST("/api/webhook/crm", async (request, { from, waitUntil }) => {
      try {
        const body = (await request.json()) as CrmWebhookPayload;

        if (!body || !body.from || !body.message) {
          return Response.json(
            { error: "Los campos 'from' y 'message' son requeridos." },
            { status: 400 }
          );
        }

        // Validación de secreto si está configurado en .env
        const expectedSecret = process.env.CRM_WEBHOOK_SECRET;
        if (expectedSecret && body.secret !== expectedSecret) {
          return Response.json(
            { error: "Acceso no autorizado: secret inválido." },
            { status: 401 }
          );
        }

        const rawRicardo =
          process.env.RICARDO_PHONE_NUMBER ||
          process.env.RICARDO_PHONE ||
          "942900456";
        const ricardoPhone = rawRicardo.replace(/\D/g, "");
        const senderPhone = body.from.replace(/\D/g, "");
        const isRicardo =
          Boolean(ricardoPhone) &&
          (senderPhone === ricardoPhone ||
            senderPhone.endsWith(ricardoPhone) ||
            ricardoPhone.endsWith(senderPhone));

        // Obtener la sesión asociada a este número de teléfono
        const source = from(body.from);

        // Soporte para reiniciar la conversación si se envía /reset o /reiniciar
        if (
          body.message === "/reset" ||
          body.message === "/new" ||
          body.message === "/reiniciar"
        ) {
          await source.reset({ reason: "User requested reset" });
          return Response.json({
            success: true,
            status: "reset",
            from: body.from,
            message: "Historial de conversación reiniciado con éxito.",
          });
        }

        // Formatear el mensaje según el rol
        let promptMessage = body.message;

        if (isRicardo) {
          const pendingLead = getPendingLead();
          let leadContext = "";
          if (pendingLead) {
            leadContext = `\n\n📌 [CONTEXTO DE LEAD PENDIENTE DE TU CONFIRMACIÓN]:
- Nombre: ${pendingLead.leadName}
- Teléfono: ${pendingLead.leadPhone}
- Interés: ${pendingLead.interestSummary}
- Horario consultado: ${pendingLead.proposedSlot}

🚨 INSTRUCCIÓN PARA TI (ASISTENTE EJECUTIVO):
Ricardo te está respondiendo o dando una instrucción sobre este cliente ("${pendingLead.leadName}").
1. Si Ricardo confirma, propone otro horario o da una instrucción, usa la herramienta 'send_lead_message' para escribirle de vuelta al cliente con cortesía en nombre de Afinitive/Ricardo.
2. Si Ricardo aprueba agendar formalmente, usa 'create_operator_meeting'.
3. Luego, responde directamente a Ricardo confirmándole en un mensaje breve y ejecutivo que ya le respondiste al cliente.`;
          }

          promptMessage = `[ROL: ASISTENTE EJECUTIVO DE RICARDO - Mensaje entrante de Ricardo (+51942900456)]: ${body.message}${leadContext}`;
        } else if (body.name) {
          promptMessage = `[Remitente: ${body.name} (${body.from})]: ${body.message}`;
        }

        const session = await source.send(promptMessage, {
          auth: null,
          turnPolicy: "queue",
        });

        return Response.json({
          success: true,
          status: "queued",
          sessionId: session.id,
          from: body.from,
          isRicardo,
        });
      } catch (error: any) {
        console.error("Error en webhook CRM:", error);
        return Response.json(
          {
            error:
              error?.message || "Error interno al procesar el mensaje en Eve.",
            details: String(error),
            stack: error?.stack,
          },
          { status: 500 }
        );
      }
    }),
  ],

  events: {
    async "message.completed"(eventData: any, channel: any, ctx: any) {
      const crmCallbackUrl =
        process.env.CRM_CALLBACK_URL ||
        (process.env.CRM_API_URL
          ? `${process.env.CRM_API_URL.replace(/\/+$/, "")}/api/webhooks/eve-response`
          : null);
      const crmApiKey = process.env.CRM_API_KEY;

      // Si el CRM configuró una URL de callback, despachar la respuesta automáticamente
      if (crmCallbackUrl && eventData?.message) {
        try {
          const recipientPhone =
            channel?.continuation?.token || ctx?.session?.id;

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (crmApiKey) {
            headers["Authorization"] = `Bearer ${crmApiKey}`;
          }

          await fetch(crmCallbackUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              to: recipientPhone,
              reply: eventData.message,
              sessionId: ctx?.session?.id,
            }),
          });
        } catch (err) {
          console.error("Error enviando callback al CRM:", err);
        }
      }
    },
  },
});
