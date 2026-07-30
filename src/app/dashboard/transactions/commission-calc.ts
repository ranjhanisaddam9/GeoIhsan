// Commission maths shared by the full transaction form and the dashboard's
// Pending Commission popup, so the two can't drift apart.

export type CommissionValues = {
  commission_amount: string;
  commission_paid: string;
  commission_discount: string;
  commission_balance: string;
};

export function formatMoney(n: number) {
  return n.toFixed(2);
}

export function toNumber(value: string) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

// Keeps only digits and at most one decimal point as the user types.
export function normalizeNumeric(raw: string) {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
}

// Whatever is left after what was paid and what was written off.
export function withCommissionBalance<T extends CommissionValues>(form: T): T {
  return {
    ...form,
    commission_balance: formatMoney(
      toNumber(form.commission_amount) -
        (toNumber(form.commission_paid) + toNumber(form.commission_discount)),
    ),
  };
}

// Editing Amount or Received also re-suggests the Discount: a partial
// payment settles the commission, so the unpaid remainder is written off;
// receiving nothing at all writes off nothing and leaves the full amount
// outstanding. Discount stays editable — overriding it just re-runs the
// balance.
export function withCommissionDerived<T extends CommissionValues>(form: T): T {
  const amount = toNumber(form.commission_amount);
  const paid = toNumber(form.commission_paid);
  return withCommissionBalance({
    ...form,
    commission_discount: formatMoney(paid > 0 ? amount - paid : 0),
  });
}
