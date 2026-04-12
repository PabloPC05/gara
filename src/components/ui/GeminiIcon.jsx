import geminiLogo from '../../assets/gemini-icon-logo.svg';

/**
 * GeminiIcon — renders the official Google Gemini logo from the imported SVG asset.
 * Accepts `size` and `className`. Any other props (e.g. `strokeWidth` from
 * lucide-style callers) are intentionally ignored.
 */
export function GeminiIcon({ size = 24, className = '' }) {
  return (
    <img
      src={geminiLogo}
      alt="Gemini"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  );
}
