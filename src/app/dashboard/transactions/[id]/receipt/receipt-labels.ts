export type ReceiptLanguage = "english" | "urdu" | "sindhi";

export const RECEIPT_LANGUAGES: { value: ReceiptLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "urdu", label: "Urdu" },
  { value: "sindhi", label: "Sindhi" },
];

export function isReceiptLanguage(value: string | null | undefined): value is ReceiptLanguage {
  return value === "english" || value === "urdu" || value === "sindhi";
}

type ReceiptLabels = {
  companyTagline: string;
  voided: string;
  voidedNote: string;
  sender: string;
  from: string;
  to: string;
  receiver: string;
  truckNumber: string;
  driver: string;
  coBroker: string;
  item: string;
  qty: string;
  weightKg: string;
  charges: string;
  fare: string;
  labour: string;
  weighing: string;
  misc: string;
  totalAmount: string;
  advanceReceived: string;
  balance: string;
  note: string;
  noteWeight: string;
  noteTarping: string;
  contact: string;
  printedBy: string;
};

const RECEIPT_LABELS: Record<ReceiptLanguage, ReceiptLabels> = {
  english: {
    companyTagline: "Goods Transport Company",
    voided: "VOIDED",
    voidedNote: "NOT VALID — this transaction has been cancelled",
    sender: "Sender",
    from: "From",
    to: "To",
    receiver: "Receiver",
    truckNumber: "Truck Number",
    driver: "Driver",
    coBroker: "C/o Broker",
    item: "Item",
    qty: "Qty",
    weightKg: "Weight (KG)",
    charges: "Charges",
    fare: "Fare",
    labour: "Labour",
    weighing: "Weighing",
    misc: "Misc",
    totalAmount: "Total Amount",
    advanceReceived: "Advance Received",
    balance: "Balance",
    note: "Note:",
    noteWeight:
      "In case of a weight discrepancy upon vehicle weighment, an allowance of up to 70 kg will be permitted.",
    noteTarping:
      "Tarping the cargo is part of the driver's job. If there is any damage, both the truck owner and driver will be liable.",
    contact: "Contact:",
    printedBy: "printed by:",
  },
  urdu: {
    companyTagline: "مال بردار کمپنی",
    voided: "منسوخ شدہ",
    voidedNote: "غیر معتبر — یہ ٹرانزیکشن منسوخ کر دی گئی ہے",
    sender: "بھیجنے والا",
    from: "سے",
    to: "تک",
    receiver: "وصول کنندہ",
    truckNumber: "ٹرک نمبر",
    driver: "ڈرائیور",
    coBroker: "بذریعہ دلال",
    item: "چیز",
    qty: "مقدار",
    weightKg: "وزن (کلوگرام)",
    charges: "اخراجات",
    fare: "کرایہ",
    labour: "مزدوری",
    weighing: "تلائی",
    misc: "متفرق",
    totalAmount: "کل رقم",
    advanceReceived: "وصول شدہ ایڈوانس",
    balance: "بقایا رقم",
    note: "نوٹ:",
    noteWeight:
      "گاڑی کی تلائی میں وزن کے فرق کی صورت میں 70 کلوگرام تک کی رعایت دی جائے گی۔",
    noteTarping:
      "سامان کو ترپال سے ڈھانپنا ڈرائیور کی ذمہ داری ہے۔ کسی بھی نقصان کی صورت میں ٹرک مالک اور ڈرائیور دونوں ذمہ دار ہوں گے۔",
    contact: "رابطہ:",
    printedBy: "پرنٹ کردہ:",
  },
  sindhi: {
    companyTagline: "مال بردار ڪمپني",
    voided: "رد ٿيل",
    voidedNote: "غير قانوني — هي ٽرانزيڪشن رد ڪئي وئي آهي",
    sender: "موڪليندڙ",
    from: "کان",
    to: "تائين",
    receiver: "وصول ڪندڙ",
    truckNumber: "ٽرڪ نمبر",
    driver: "ڊرائيور",
    coBroker: "دلال جي معرفت",
    item: "شيءِ",
    qty: "تعداد",
    weightKg: "وزن (ڪلوگرام)",
    charges: "خرچ",
    fare: "ڀاڙو",
    labour: "مزدوري",
    weighing: "تور",
    misc: "ٻيا خرچ",
    totalAmount: "ڪل رقم",
    advanceReceived: "مليل ائڊوانس",
    balance: "بچت رقم",
    note: "نوٽ:",
    noteWeight:
      "گاڏي جي توري ۾ وزن جي فرق جي صورت ۾ 70 ڪلوگرام تائين رعايت ڏني ويندي.",
    noteTarping:
      "سامان تي ترپال وجهڻ ڊرائيور جي ذميواري آهي. ڪنهن به نقصان جي صورت ۾ ٽرڪ مالڪ ۽ ڊرائيور ٻئي ذميوار هوندا.",
    contact: "رابطو:",
    printedBy: "پرنٽ ڪيل:",
  },
};

export function getReceiptLabels(language: ReceiptLanguage): ReceiptLabels {
  return RECEIPT_LABELS[language];
}
