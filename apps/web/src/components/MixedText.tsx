// Thai script runs (incl. inner spaces and abbreviation dots, e.g. "ม.ค.").
const THAI_RUN = /([฀-๿][฀-๿\s.]*[฀-๿.]|[฀-๿])/u;

/**
 * Renders a mixed Thai/English string with every Thai run wrapped in
 * lang="th", so screen readers switch voice mid-string and the Thai font
 * stack applies. Use for any bilingual copy that arrives as one string.
 */
export function MixedText({ text }: { text: string }) {
  const parts = text.split(THAI_RUN);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <span key={i} lang="th">{p}</span> : p))}
    </>
  );
}
