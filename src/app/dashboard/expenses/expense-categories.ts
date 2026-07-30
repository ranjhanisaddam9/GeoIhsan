// Plain module (no "use client") so both the Expenses manager and the
// Income Statement report can import it, server or client side.
export const EXPENSE_CATEGORIES = [
  "Home",
  "Tea",
  "Petrol",
  "Ice",
  "Stationary",
  "Internet Bill",
  "Mobile Recharge",
  "Other",
] as const;
