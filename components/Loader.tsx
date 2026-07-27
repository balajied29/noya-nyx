/**
 * First-visit loader.
 *
 * The mark fills with brass from the bottom as the page loads — the same pour
 * the header wordmark does on hover, held long enough to read.
 *
 * Deliberately not a client component. A curtain over the page is exactly the
 * wrong thing to make dependent on React hydrating: the overlay is hidden by
 * default and only *becomes* visible once the inline script below sets
 * `data-loader="on"`. So the failure modes all land safely —
 *
 *   JS disabled     the attribute is never set, no curtain ever appears
 *   JS slow/broken  the 4s failsafe lifts it regardless
 *   already visited  sessionStorage skips it entirely
 *
 * The script both applies the scroll lock and schedules its own release, so
 * the lock can never outlive the thing that set it.
 */

const BOOT = `(function () {
  var d = document.documentElement;
  var KEY = "noya:loaded";
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  d.setAttribute("data-loader", "on");

  var off = function () {
    if (d.getAttribute("data-loader") !== "on") return;
    d.setAttribute("data-loader", "off");
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  };

  // Hold long enough for the pour to read as a pour, but measured from boot —
  // a slow page never waits the full hold on top of its own load time.
  var HOLD = 1150;
  var start = Date.now();
  var finish = function () {
    setTimeout(off, Math.max(0, HOLD - (Date.now() - start)));
  };

  if (document.readyState === "complete") finish();
  else window.addEventListener("load", finish);

  // One stalled image must never hold the page hostage.
  setTimeout(off, 4000);
})();`;

export default function Loader() {
  return (
    <>
      {/* Runs during parse, before the overlay below is painted. */}
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      {/* aria-hidden: the real page is already in the DOM behind this, and a
          screen reader should be reading that, not a decorative curtain. */}
      <div className="loader" aria-hidden="true">
        <span className="loader__mark" />
      </div>
    </>
  );
}
