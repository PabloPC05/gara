import geminiOfficialLogo from '../../assets/gemini-official.webp';

/**
 * GeminiIcon — wraps the official Gemini product icon vendored from Google's
 * Brand Resource Center CDN. Callers may resize it, but should not recolor or
 * otherwise alter the asset.
 */
export function GeminiIcon({ size = 24, className = '', alt = '' }) {
  const style =
    typeof size === 'number'
      ? undefined
      : {
          width: size,
          height: size,
        };

  return (
    <img
      src={geminiOfficialLogo}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      className={`inline-block shrink-0 select-none align-middle object-contain ${className}`.trim()}
      style={style}
      draggable="false"
      decoding="async"
    />
  );
}
