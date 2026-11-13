// Prototype-only state switcher (never ships).
// A page lists its states in <meta name="proto-states" content="default loading empty error">.
// Elements marked data-proto-state="loading error" are shown only in those states.
// Select a state with ?state=loading (the screenshot harness does this for every listed state).
(() => {
  const meta = document.querySelector('meta[name="proto-states"]');
  const states = meta ? meta.content.trim().split(/\s+/) : ['default'];
  const asked = new URLSearchParams(location.search).get('state');
  const state = states.includes(asked) ? asked : states[0];
  document.documentElement.dataset.protoState = state;
  const apply = () => document.querySelectorAll('[data-proto-state]').forEach(el => {
    el.hidden = !el.dataset.protoState.split(/\s+/).includes(state);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
