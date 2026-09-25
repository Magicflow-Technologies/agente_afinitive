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

const leadsStore = new Map<string, LeadData>();
let latestPhone: string | null = null;

export function saveLead(lead: Partial<LeadData> & { leadPhone: string }) {
  const cleanPhone = lead.leadPhone.replace(/\D/g, "");
  const existing = leadsStore.get(cleanPhone) || {
    leadPhone: lead.leadPhone,
    timestamp: new Date().toISOString(),
  };

  const updated: LeadData = {
    ...existing,
    ...lead,
    timestamp: new Date().toISOString(),
  };

  leadsStore.set(cleanPhone, updated);
  latestPhone = cleanPhone;
  return updated;
}

export function getLead(phone?: string): LeadData | null {
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    return leadsStore.get(cleanPhone) || null;
  }
  if (latestPhone && leadsStore.has(latestPhone)) {
    return leadsStore.get(latestPhone)!;
  }
  return null;
}

export function getAllRecentLeads(): LeadData[] {
  return Array.from(leadsStore.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
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

