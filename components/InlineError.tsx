export function InlineError({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      role="alert"
    >
      {message}
    </div>
  );
}
