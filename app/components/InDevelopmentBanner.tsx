type InDevelopmentBannerProps = {
  message: string;
};

export default function InDevelopmentBanner({ message }: InDevelopmentBannerProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-6 sm:px-10">
      <div className="rounded-md border border-rose-300 bg-rose-600 px-3 py-2 text-center text-[11px] font-semibold tracking-[0.08em] text-white">
        {message}
      </div>
    </div>
  );
}
