"use client";

import Link from "next/link";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "../../../_components/ui";
import { ArrowLeftIcon, PhoneIcon, PrinterIcon, WhatsAppIcon } from "../../../_components/icons";
import { getReceiptLabels, type ReceiptLanguage } from "./receipt-labels";

type ReceiptTransaction = {
  transaction_number: string;
  transaction_date: string;
  item_name: string;
  quantity: number | null;
  weight: number | null;
  weighing_bridge_cost: number;
  loading_labour_charges: number;
  fare_charges: number;
  extra_charges: number;
  total_fare_charges: number;
  advance_fare: number;
  remaining_fare: number;
  is_voided: boolean;
};

function formatMoney(n: number) {
  return n.toFixed(2);
}

function phoneJoin(name: string, phone: string | null) {
  return phone ? `${name} (${phone})` : name;
}

type ContactNumber = { value: string; icon?: "whatsapp" | "phone" };

function WhatsAppNumbers({ numbers }: { numbers: ContactNumber[] }) {
  return (
    <>
      {numbers.map(({ value, icon = "whatsapp" }, index) => (
        <span key={value} className="whitespace-nowrap">
          {icon === "whatsapp" ? (
            <WhatsAppIcon className="inline h-3 w-3 align-[-1px] text-green-600" />
          ) : (
            <PhoneIcon className="inline h-3 w-3 align-[-1px] text-zinc-600" />
          )}{" "}
          {value}
          {index < numbers.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}

// transaction_date comes through as an ISO "YYYY-MM-DD" date string.
function formatDateDMY(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <span className="font-medium text-zinc-600">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function ChargeRow({
  label,
  value,
  bold,
  rightAlignLabel,
}: {
  label: string;
  value: number;
  bold?: boolean;
  rightAlignLabel?: boolean;
}) {
  return (
    <tr className={bold ? "font-semibold" : ""}>
      <td className={`py-1 ${rightAlignLabel ? "text-end" : ""}`}>{label}</td>
      <td className="py-1 text-end">{formatMoney(value)}</td>
    </tr>
  );
}

type ReceiptCardProps = {
  transaction: ReceiptTransaction;
  fromCityName: string;
  toCityName: string;
  destinationLocationName: string | null;
  destinationAddress: string | null;
  destinationCityName: string | null;
  truckNumber: string;
  driverName: string;
  driverPhone: string | null;
  clientName: string;
  brokerName: string;
  brokerPhone: string | null;
  printedByUsername: string;
  language: ReceiptLanguage;
};

function ReceiptCard({
  transaction,
  fromCityName,
  toCityName,
  destinationLocationName,
  destinationAddress,
  destinationCityName,
  truckNumber,
  driverName,
  driverPhone,
  clientName,
  brokerName,
  brokerPhone,
  printedByUsername,
  language,
}: ReceiptCardProps) {
  const labels = getReceiptLabels(language);
  const isRtl = language === "urdu" || language === "sindhi";
  const receiverValue = destinationLocationName
    ? [destinationLocationName, destinationAddress, destinationCityName]
        .filter(Boolean)
        .join(" - ")
    : null;

  return (
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full max-w-2xl overflow-hidden rounded-lg border-2 border-zinc-900 bg-white p-6 pb-3 text-black print:max-w-none print:min-w-0 print:flex-1 print:basis-0 print:rounded-none print:border print:p-[5px] print:pb-[5px]"
      >
        <div className="-mx-6 -mt-6 border-b-2 border-zinc-900 print:-mx-[5px] print:-mt-[5px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Banner-Txt.png"
            alt="GeoIhsan"
            className="block h-auto w-full object-cover"
          />
        </div>

        {transaction.is_voided && (
          <div className="my-6 rounded-md border-4 border-red-600 px-4 py-8 text-center">
            <p className="text-3xl font-extrabold tracking-widest text-red-600">
              {labels.voided}
            </p>
            <p className="mt-1 text-sm font-medium text-red-600">{labels.voidedNote}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            {formatDateDMY(transaction.transaction_date)} | {transaction.transaction_number}
          </div>
          <Field label={labels.sender} value={clientName} />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Field label={labels.from} value={fromCityName} />
          <Field label={labels.to} value={toCityName} />
          {receiverValue && <Field label={labels.receiver} value={receiverValue} wide />}
          <Field label={labels.truckNumber} value={truckNumber} />
          <Field label={labels.driver} value={phoneJoin(driverName, driverPhone)} />
        </div>

        <hr className="mt-4 border-zinc-400" />

        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[10%]" />
            <col className="w-[20%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-400 text-start font-medium text-zinc-600">
              <th className="pt-0 pb-1">{labels.item}</th>
              <th className="pt-0 pb-1">{labels.qty}</th>
              <th className="pt-0 pb-1">{labels.weightKg}</th>
              <th className="pt-0 pb-1 text-center">{labels.charges}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 align-top">{transaction.item_name}</td>
              <td className="py-1 align-top">
                {transaction.quantity !== null ? String(transaction.quantity) : "—"}
              </td>
              <td className="py-1 text-center align-top">
                {transaction.weight !== null ? String(transaction.weight) : "—"}
              </td>
              <td className="py-1 align-top" rowSpan={2}>
                {!transaction.is_voided && (
                  <table className="w-full">
                    <tbody>
                      <ChargeRow
                        label={labels.fare}
                        value={transaction.fare_charges}
                        rightAlignLabel
                      />
                      <ChargeRow
                        label={labels.labour}
                        value={transaction.loading_labour_charges}
                        rightAlignLabel
                      />
                      <ChargeRow
                        label={labels.weighing}
                        value={transaction.weighing_bridge_cost}
                        rightAlignLabel
                      />
                      <ChargeRow
                        label={labels.misc}
                        value={transaction.extra_charges}
                        rightAlignLabel
                      />
                    </tbody>
                  </table>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="pt-1 pb-0 text-start align-bottom">
                <span className="font-medium text-zinc-600">{labels.coBroker}: </span>
                {phoneJoin(brokerName, brokerPhone)}
              </td>
            </tr>
          </tbody>
        </table>

        {!transaction.is_voided && (
          <>
            <hr className="mt-1 border-zinc-400" />
            <table className="w-full text-sm">
              <tbody>
                <ChargeRow
                  label={labels.totalAmount}
                  value={transaction.total_fare_charges}
                  bold
                />
                <ChargeRow label={labels.advanceReceived} value={transaction.advance_fare} />
                <ChargeRow label={labels.balance} value={transaction.remaining_fare} bold />
              </tbody>
            </table>
          </>
        )}

        <div className="mt-3 text-xs text-zinc-700">
          <p className="font-bold">{labels.note}</p>
          <ol className="list-decimal space-y-0.5 ps-4">
            <li>{labels.noteWeight}</li>
            <li>{labels.noteTarping}</li>
            <li className="font-bold">{labels.emergencyContact}</li>
          </ol>
          <p className="ps-4">
            M. Azeem (
            <WhatsAppNumbers
              numbers={[
                { value: "03003038810" },
                { value: "03113935380" },
                { value: "03013459152", icon: "phone" },
              ]}
            />
            )
          </p>
          <p className="ps-4">
            A. Nawaz (
            <WhatsAppNumbers
              numbers={[{ value: "03443115466" }, { value: "03073356638", icon: "phone" }]}
            />
            )
          </p>
        </div>

        <hr className="mt-0 mb-1 border-zinc-400" />

        <div className="mt-0 flex items-center justify-between text-xs text-zinc-600">
          <span>{labels.disclaimer}</span>
          <span>
            {labels.printedBy} {printedByUsername}
          </span>
        </div>
      </div>
  );
}

export function ReceiptView(props: ReceiptCardProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 print:max-w-none print:w-full print:px-0 print:py-0">
      <style>{"@media print { @page { size: A4 landscape; margin: 10mm; } }"}</style>

      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/dashboard/transactions" className={secondaryButtonClass}>
          <ArrowLeftIcon />
          Back to Transactions
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className={primaryButtonClass}
        >
          <PrinterIcon />
          Print
        </button>
      </div>

      <div className="flex flex-col items-center gap-10 print:flex-row print:items-stretch print:justify-center print:gap-[6mm]">
        <ReceiptCard {...props} />
        <div className="hidden print:block print:border-l print:border-dashed print:border-zinc-400" />
        <ReceiptCard {...props} />
      </div>
    </div>
  );
}
