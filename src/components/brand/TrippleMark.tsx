/**
 * The Trippple tri-fold mark (motion study: /ani.html). Three blades: two navy side blades and the red
 * central "T", crossed by a slate axis rule. Flat fills only (A-17). Motion lives in src/app/brand.css,
 * keyed off the wrapper's class (`.tmark--splash` one-shot).
 */
export function TrippleMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`tmark ${className}`} viewBox="0 0 96 108" fill="none" aria-hidden="true" focusable="false">
      <polygon className="tmark__blade tmark__blade--left" points="15,24 29,16 29,82 15,90" />
      <polygon className="tmark__blade tmark__blade--center" points="35,14 61,14 61,25 54,25 54,94 42,94 42,25 35,25" />
      <polygon className="tmark__blade tmark__blade--right" points="67,18 81,26 81,92 67,84" />
      <line className="tmark__rule" x1="8" y1="54" x2="88" y2="54" />
    </svg>
  );
}

/**
 * Splash on every full page load, including refresh (user directive 2026-11-14). Client-side navigations never
 * replay it, because the root layout persists. Pure CSS timeline (enter → breathe → converge → lift, ~2 s), so it also
 * finishes without JavaScript and never blocks input (pointer-events: none). Skipped under automation (navigator.webdriver).
 */
export function Splash() {
  return (
    <>
      <script
        // Runs before paint: automated browsers skip the splash so tests are not delayed.
        dangerouslySetInnerHTML={{
          __html:
            "try{if(navigator.webdriver){document.documentElement.dataset.splash='off'}}catch(e){}",
        }}
      />
      <div className="tsplash" aria-hidden="true">
        <div className="tsplash__plate">
          <TrippleMark className="tmark--splash" />
        </div>
        <span className="tsplash__word">Trippple</span>
      </div>
    </>
  );
}
