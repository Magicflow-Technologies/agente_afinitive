export interface PendingLead {
  leadName: string;
  leadPhone: string;
  interestSummary: string;
  proposedSlot: string;
  timestamp: string;
}

let latestPendingLead: PendingLead | null = null;

export function setPendingLead(lead: PendingLead) {
  latestPendingLead = lead;
}

export function getPendingLead(): PendingLead | null {
  return latestPendingLead;
}

export function clearPendingLead() {
  latestPendingLead = null;
}
