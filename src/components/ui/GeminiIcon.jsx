/**
 * GeminiIcon — the 4-pointed star/sparkle that represents Google Gemini.
 * Accepts `size` and `className`. Any other props (e.g. `strokeWidth` from
 * lucide-style callers) are intentionally ignored.
 */
export function GeminiIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C11.4 7.8 9 10.4 2 12C9 13.6 11.4 16.2 12 22C12.6 16.2 15 13.6 22 12C15 10.4 12.6 7.8 12 2Z" />
    </svg>
  );
}
