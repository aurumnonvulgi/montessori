type PrivacyDisclosuresCardProps = {
  compact?: boolean;
  className?: string;
};

export default function PrivacyDisclosuresCard({
  compact = false,
  className,
}: PrivacyDisclosuresCardProps) {
  return (
    <section className={`rounded-2xl border border-amber-200 bg-amber-50/80 shadow-sm ${compact ? "p-3" : "p-4"} ${className ?? ""}`}>
      <div className="space-y-2">
        <p className={`font-semibold text-amber-900 ${compact ? "text-sm" : "text-base"}`}>
          Privacy Disclosures + On-Device Processing
        </p>
        <ul className={`list-disc space-y-1 pl-5 text-amber-900 ${compact ? "text-[11px]" : "text-xs"}`}>
          <li>Most lesson logic runs in your browser on this device.</li>
          <li>Microphone is OFF by default and used only for live speech checks when you turn it on.</li>
          <li>This app does not record, save, or upload raw microphone audio.</li>
          <li>Speech recognition depends on browser/OS services, which may process audio off-device.</li>
          <li>Progress and settings are saved in local browser storage.</li>
          <li>If this deployment enables Supabase, anonymous activity metadata may sync to Supabase.</li>
          <li>No ads, no third-party tracker scripts, and no data sales.</li>
        </ul>
      </div>
    </section>
  );
}
