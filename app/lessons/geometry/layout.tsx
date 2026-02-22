import InDevelopmentBanner from "../../components/InDevelopmentBanner";

export default function GeometryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <InDevelopmentBanner message="In Development | No Logic" />
      {children}
    </>
  );
}
