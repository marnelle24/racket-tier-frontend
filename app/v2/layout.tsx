export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full max-w-none mx-0 px-0">
      {children}
    </div>
  );
}
