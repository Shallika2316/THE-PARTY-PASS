export const WATERMARK = 'ShallikaSethDesigns';

/** Designer credit: pinned to the bottom corner on larger screens, at the end of the page on phones. */
export function Watermark() {
  return (
    <p className="watermark">
      <span aria-hidden>©</span> {WATERMARK}
    </p>
  );
}
