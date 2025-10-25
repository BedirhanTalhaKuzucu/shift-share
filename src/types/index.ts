export type Shift = {
  id: string;
  createdAt: number;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  notes?: string;
  ownerId: string;           
  status: "open" | "claimed" | "cancelled";
  claimerContact?: string;
};

export type Draft = {
  startsAt: string;
  endsAt: string;
  notes?: string;
  ownerId: string;
};
