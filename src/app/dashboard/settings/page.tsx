import { getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isReceiptLanguage } from "../transactions/[id]/receipt/receipt-labels";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const profile = await getUserProfile();

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Access Denied
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Only admins can view settings.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: languageSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "receipt_language")
    .single();

  const initialLanguage = isReceiptLanguage(languageSetting?.value)
    ? languageSetting.value
    : "english";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Settings</h1>
      <SettingsForm initialLanguage={initialLanguage} />
    </div>
  );
}
