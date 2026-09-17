/**
 * Inline SVG contact icons. Inline (not a font) so they survive printing to PDF
 * and never depend on a webfont that a print driver might not load.
 */
const paths: Record<string, string> = {
  email: 'M2 4h12v8H2z M2 4l6 4 6-4',
  phone:
    'M3 2.5h2.2l1 2.4-1.4 1a8 8 0 0 0 3.3 3.3l1-1.4 2.4 1V11a1.5 1.5 0 0 1-1.6 1.5A10.5 10.5 0 0 1 2.5 4.1 1.5 1.5 0 0 1 3 2.5z',
  location: 'M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.8 8 14 8 14z M8 7.5h.01',
  link: 'M6.5 9.5a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5l-1 1 M9.5 6.5a2.5 2.5 0 0 0-3.5 0l-2 2a2.5 2.5 0 0 0 3.5 3.5l1-1',
  linkedin: 'M3 6v7 M3 3.6v.01 M7 13V6 M7 9a2.5 2.5 0 0 1 5 0v4',
  github:
    'M10.5 14v-2.2c0-.7-.2-1.1-.5-1.4 1.8-.2 3.3-.9 3.3-3.9 0-.9-.3-1.6-.8-2.1.1-.2.3-1-.1-2.1 0 0-.7-.2-2.2.8a7.4 7.4 0 0 0-4 0C4.7 2.1 4 2.3 4 2.3c-.4 1.1-.2 1.9-.1 2.1-.5.5-.8 1.2-.8 2.1 0 3 1.5 3.7 3.3 3.9-.2.2-.4.6-.5 1.1-.4.2-1.6.6-2.3-.7 0 0-.4-.8-1.2-.8 0 0-.8 0 .1.5 0 0 .5.3.9 1.2 0 0 .5 1.5 2.5 1V14',
};

export function Icon({ name }: { name: keyof typeof paths | string }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      className="cv-icon"
      viewBox="0 0 16 16"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}
