import FeedbackWidget from "../components/FeedbackWidget";

export default function LessonsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <div className="mx-auto w-full max-w-7xl px-6 pb-6 sm:px-10">
        <FeedbackWidget placement="inline" />
      </div>
    </>
  );
}
