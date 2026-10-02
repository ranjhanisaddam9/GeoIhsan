"use client";

import Link from "next/link";
import { Noto_Naskh_Arabic } from "next/font/google";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "../../../_components/ui";
import { ArrowLeftIcon, PhoneIcon, PrinterIcon, WhatsAppIcon } from "../../../_components/icons";
import { getReceiptLabels, type ReceiptLanguage } from "./receipt-labels";

// Geist has no Arabic-script glyphs, so without this the Urdu note falls back
// to whatever system font the printing PC has. Naskh holds up at small print
// sizes, where Nastaliq's stacked letterforms blur.
const notoNaskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "700"] });

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

// Thousands separators so 124,000.00 can't be misread as 12,400.00 at print
// size. Locale pinned so server and client render the same string.
function formatMoney(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            <WhatsAppIcon className="inline h-[8pt] w-[8pt] align-[-1px] text-green-600" />
          ) : (
            <PhoneIcon className="inline h-[8pt] w-[8pt] align-[-1px] text-zinc-700" />
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
      <span className="font-medium text-zinc-700">{label}: </span>
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
    <tr className={bold ? "text-[10.5pt] font-bold" : ""}>
      <td className={`py-1 ${rightAlignLabel ? "text-end" : ""}`}>{label}</td>
      <td className="py-1 text-end tabular-nums">{formatMoney(value)}</td>
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
        className="flex min-h-[207mm] w-full max-w-[148mm] flex-col overflow-hidden rounded-lg border-0 bg-white p-[7.5pt] text-[9.5pt] text-black print:max-w-none print:min-w-0 print:w-auto print:rounded-none print:border-0"
      >
        {/* Bled to the page edges — the A5 page has no margin of its own.
            The 3.08 aspect puts it at ~48mm tall across A5's 148mm. Like the
            footer, it's invisible (not removed) in print: the paper carries
            its own header and footer, and the content must stay where it is. */}
        <div className="-mx-[7.5pt] -mt-[7.5pt] print:invisible">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Banner-Header.webp"
            alt="GeoIhsan"
            className="block h-auto w-full object-cover"
          />
        </div>

        {/* Banner-to-Balance block, inset 40px from the page edge: the card
            contributes 7.5pt (10px) and this adds the remaining 30px. It takes
            the free space (flex-1) so the mt-auto on C/o still bottoms out the
            totals; the note, rule and footer below keep the card's own inset. */}
        <div className="flex flex-1 flex-col px-[30px]">
          {transaction.is_voided && (
            <div className="my-6 rounded-md border-4 border-red-600 px-4 py-8 text-center">
              <p className="text-3xl font-extrabold tracking-widest text-red-600">
                {labels.voided}
              </p>
              <p className="mt-1 text-sm font-medium text-red-600">{labels.voidedNote}</p>
            </div>
          )}

          <div className="mt-[5pt] grid grid-cols-2 gap-x-4 gap-y-[7pt]">
            <div>
              {formatDateDMY(transaction.transaction_date)} | {transaction.transaction_number}
            </div>
            <Field label={labels.sender} value={clientName} />
          </div>

          <div className="mt-[7pt] grid grid-cols-2 gap-x-4 gap-y-[7pt]">
            <Field label={labels.from} value={fromCityName} />
            <Field label={labels.to} value={toCityName} />
            {receiverValue && <Field label={labels.receiver} value={receiverValue} wide />}
            <Field label={labels.truckNumber} value={truckNumber} />
            <Field label={labels.driver} value={phoneJoin(driverName, driverPhone)} />
          </div>

          <hr className="mt-4 border-zinc-400" />

          <table className="w-full table-fixed">
            {/* Amount gets 40%: at 9.5-10.5pt with thousands separators, a
                figure like 1,240,000.00 needs ~23mm, which a 30% column split
                in two could not hold. */}
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
              <col className="w-[40%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-400 text-center font-bold text-zinc-700">
                <th className="pt-0 pb-1">{labels.item}</th>
                <th className="pt-0 pb-1">{labels.qty}</th>
                <th className="pt-0 pb-1">{labels.weightKg}</th>
                <th className="pt-0 pb-1">{labels.charges}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 text-center align-top">{transaction.item_name}</td>
                <td className="py-1 text-center align-top">
                  {transaction.quantity !== null ? String(transaction.quantity) : "—"}
                </td>
                <td className="py-1 text-center align-top">
                  {transaction.weight !== null ? String(transaction.weight) : "—"}
                </td>
                <td className="py-1 align-top">
                  {!transaction.is_voided && (
                    // Fixed 50/50 split of the 40% Amount column: labels end at
                    // 80% of the content width, values at 100%. The totals block
                    // below repeats those two edges so the two align.
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-1/2" />
                        <col className="w-1/2" />
                      </colgroup>
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
            </tbody>
          </table>

          {/* First element of the bottom group, so it carries the mt-auto: the
              free space collects above this line and everything from here down
              — broker, totals, note, footer — sits at the foot of the page. */}
          <div className="mt-auto pt-1">
            <span className="text-zinc-700">{labels.coBroker}: </span>
            {phoneJoin(brokerName, brokerPhone)}
          </div>

          {!transaction.is_voided && (
            <>
              <hr className="mt-1 border-zinc-400" />
              {/* 50% wide, so its value column lands on the same 80%-100% span
                  as the charges above and its labels end on the same edge. The
                  label column is wider than the charges' because "Amount
                  Received" needs the room; it just starts further left. */}
              <table className="ms-auto w-1/2 table-fixed">
                <colgroup>
                  <col className="w-[60%]" />
                  <col className="w-[40%]" />
                </colgroup>
                <tbody>
                  <ChargeRow
                    label={labels.totalAmount}
                    value={transaction.total_fare_charges}
                    bold
                    rightAlignLabel
                  />
                  <ChargeRow
                    label={labels.advanceReceived}
                    value={transaction.advance_fare}
                    rightAlignLabel
                  />
                  <ChargeRow
                    label={labels.balance}
                    value={transaction.remaining_fare}
                    bold
                    rightAlignLabel
                  />
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Always Urdu and always RTL, whatever language the rest of the
            receipt is in. The items carry their own Urdu numerals, so this
            is a plain list rather than an <ol> that would number it twice.
            9pt and solid black: Urdu's dots are what tell letters apart, and
            they drop out at fine-print sizes or in printer-dithered grey. */}
        <div
          dir="rtl"
          className={`mt-[6pt] space-y-[2pt] text-right text-[9pt] leading-[1.7] text-black print:invisible ${notoNaskh.className}`}
        >
          <p className="font-bold">نوٹ:</p>
          <p className="pe-[4pt]">
            ۱۔ وزن میں فرق کی صورت میں، صرف 30 ٹن لوڈ کے لیے زیادہ سے زیادہ 70
            کلوگرام تک کی رعایت لاگو ہوگی۔
          </p>
          <p className="pe-[4pt]">
            ۲۔ گاڑی پر ترپال باندھنا ڈرائیور کے فرائض میں شامل ہے۔ کسی بھی قسم
            کے نقصان کی صورت میں ٹرک کے مالک اور ڈرائیور دونوں ذمہ دار ہوں گے۔
          </p>
        </div>

        {/* Closing rule, bled to the edges like the header. Both colours are
            sampled from the banner: its teal (#224c4e) at the outer ends,
            its gold (#b98438) blending through the middle. print-color-adjust
            keeps it from being dropped as a background when printing. */}
        <div
          aria-hidden="true"
          className="-mx-[7.5pt] mt-[5pt] h-[2.3pt] print:invisible"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #224c4e 0%, #b98438 50%, #224c4e 100%)",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        />

        <div className="mt-[2pt] text-[8pt] text-zinc-900 print:invisible">
          {/* Pinned LTR so Address stays left and Proprietor right even on an
              Urdu or Sindhi receipt, where the card itself runs RTL. */}
          <div dir="ltr" className="flex items-baseline justify-between gap-4">
            <span>Address: Geo Ihsan Goods Transport, Bypass Sehwan Road Dadu</span>
            {/* Banner teal (#224c4e) behind white text; print-color-adjust
                stops the browser dropping the background when printing. The
                clip-path pulls the bottom-left corner 6pt inward so the left
                edge slants like a backslash; the extra left padding keeps the
                text clear of that slant. The negative right margin bleeds the
                colour past the card's 7.5pt padding to the page edge, and the
                right padding grows by the same 7.5pt so the text doesn't move. */}
            <span
              className="-mr-[7.5pt] shrink-0 py-[1.5pt] pr-[14.5pt] pl-[12pt] text-[9.5pt] font-semibold tracking-[0.01em] whitespace-nowrap text-white"
              style={{
                backgroundColor: "#224c4e",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 6pt 100%)",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              }}
            >
              Proprietor: Ihsan Ali Ranjhani
            </span>
          </div>
          {/* One person per line: at 8pt the five numbers no longer fit on a
              single line, and wrapping mid-list would split a name from its
              numbers. */}
          <div className="mt-[3pt] space-y-[1.5pt] text-center">
            <p>
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
            <p>
              A. Nawaz (
              <WhatsAppNumbers
                numbers={[{ value: "03443115466" }, { value: "03073356638", icon: "phone" }]}
              />
              )
            </p>
          </div>
        </div>
      </div>
  );
}

export function ReceiptView(props: ReceiptCardProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 print:max-w-none print:w-full print:px-0 print:py-0">
      <style>{"@media print { @page { size: A5; margin: 0; } }"}</style>

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

      <div className="flex flex-col items-center print:block">
        <ReceiptCard {...props} />
      </div>
    </div>
  );
}
