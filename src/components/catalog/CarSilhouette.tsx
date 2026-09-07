export function CarSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 48"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18 34.5c0-1.4 1-2.6 2.4-3.1L28 29l7.4-10.6A8 8 0 0 1 42 15h32.5a9 9 0 0 1 7.4 3.8L90 29.2l10.2 2.1a3.2 3.2 0 0 1 2.5 3.1V37H18z" />
      <circle cx="36" cy="37.5" r="6.2" />
      <circle cx="86" cy="37.5" r="6.2" />
      <circle cx="36" cy="37.5" r="2.4" fill="var(--color-bg)" />
      <circle cx="86" cy="37.5" r="2.4" fill="var(--color-bg)" />
    </svg>
  );
}
