export interface LeadData {
  leadName?: string;
  leadPhone: string;
  email?: string;
  interestSummary?: string;
  proposedSlot?: string;
  lastClientMessage?: string;
  notes?: string;
  timestamp: string;
}

const MAX_ENTRIES = 50; // Límite máximo de leads en caché temporal
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas de vigencia para coordinación activa

const leadsStore = new Map<string, LeadData>();
let latestPhone: string | null = null;

function purgeExpired() {
  const now = Date.now();
  for (const [phone, lead] of leadsStore.entries()) {
    const leadTime = new Date(lead.timestamp).getTime();
    if (now - leadTime > TTL_MS) {
      leadsStore.delete(phone);
    }
  }

  // Si aún supera el límite máximo, eliminar los más antiguos
  if (leadsStore.size > MAX_ENTRIES) {
    const sorted = Array.from(leadsStore.entries()).sort(
      (a, b) =>
        new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
    );
    while (leadsStore.size > MAX_ENTRIES) {
      const oldest = sorted.shift();
      if (oldest) {
        leadsStore.delete(oldest[0]);
      } else {
        break;
      }
    }
  }
}

export function saveLead(lead: Partial<LeadData> & { leadPhone: string }) {
  purgeExpired();

  const cleanPhone = lead.leadPhone.replace(/\D/g, "");
  const existing = leadsStore.get(cleanPhone) || {
    leadPhone: lead.leadPhone,
    timestamp: new Date().toISOString(),
  };

  // Truncar el último mensaje a 200 caracteres para optimizar tokens
  let lastClientMessage = lead.lastClientMessage || existing.lastClientMessage;
  if (lastClientMessage && lastClientMessage.length > 200) {
    lastClientMessage = lastClientMessage.slice(0, 200) + "...";
  }

  const updated: LeadData = {
    ...existing,
    ...lead,
    lastClientMessage,
    timestamp: new Date().toISOString(),
  };

  leadsStore.set(cleanPhone, updated);
  latestPhone = cleanPhone;
  return updated;
}

export function getLead(phone?: string): LeadData | null {
  purgeExpired();
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    return leadsStore.get(cleanPhone) || null;
  }
  if (latestPhone && leadsStore.has(latestPhone)) {
    return leadsStore.get(latestPhone)!;
  }
  return null;
}

export function getAllRecentLeads(limit = 3): LeadData[] {
  purgeExpired();
  return Array.from(leadsStore.values())
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);
}

export function clearLead(phone?: string) {
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    leadsStore.delete(cleanPhone);
    if (latestPhone === cleanPhone) {
      latestPhone = leadsStore.keys().next().value || null;
    }
  } else {
    leadsStore.clear();
    latestPhone = null;
  }
}

// Aliases de retrocompatibilidad
export const setPendingLead = (lead: any) => saveLead(lead);
export const getPendingLead = () => getLead();
export const clearPendingLead = () => clearLead();


