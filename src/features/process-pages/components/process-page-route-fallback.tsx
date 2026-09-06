export function ProcessPageRouteFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div
        className="border-primary-900 size-10 animate-spin rounded-full border-2 border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
