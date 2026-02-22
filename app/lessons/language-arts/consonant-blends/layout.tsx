import InDevelopmentBanner from "../../../components/InDevelopmentBanner";

export default function ConsonantBlendsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <InDevelopmentBanner message="In Development | Images, Voices, Sentences and Words Might be Inaccurate." />
      {children}
    </>
  );
}
