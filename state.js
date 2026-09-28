/* Catalogue objects stay immutable; experiment overrides are stored separately. */
const LabState = (() => {
  const FEATURES = Object.freeze({ glitchLab: true });
  const DEFAULT_GEOMETRY = Object.freeze({ alpha: 42, zeta: 48, rho: 12 });
  const allowed = new Set(["period", "period_dot", "dm", "alpha", "zeta", "rho"]);
  function create(catalogue) {
    return {
      catalogue,
      mode: "catalogue",
      experiment: {},
      model: { ...DEFAULT_GEOMETRY },
      playback: { cycles: 0, speed: 1, running: true },
      observation: { centreMHz: 400, bandwidthMHz: 100, channels: 24, samplingMs: 1, view: 'dispersed', dedispersed: false },
      signalView: "model",
      tab: "geometry",
    };
  }
  function current(state, key) {
    if (["alpha", "zeta", "rho"].includes(key)) return state.experiment[key] ?? state.model[key];
    return state.mode === "experiment" ? state.experiment[key] ?? state.catalogue[key] : state.catalogue[key];
  }
  function setExperiment(state, key, value) {
    if (!allowed.has(key) || !Number.isFinite(value)) return false;
    if (key === "period" && !(value > 0)) return false;
    if (key === "period_dot" && !(value > 0)) return false;
    if (key === "dm" && value < 0) return false;
    if (["alpha", "zeta"].includes(key) && (value < 0 || value > 180)) return false;
    if (key === "rho" && (value <= 0 || value > 90)) return false;
    state.mode = "experiment";
    state.experiment[key] = value;
    return true;
  }
  function reset(state) {
    state.experiment = {};
    state.mode = "catalogue";
    state.model = { ...DEFAULT_GEOMETRY };
    state.playback.cycles = 0;
    state.observation.dedispersed = false;
    state.observation.view = 'dispersed';
  }
  function select(state, catalogue) {
    state.catalogue = catalogue;
    reset(state);
  }
  return { FEATURES, DEFAULT_GEOMETRY, create, current, setExperiment, reset, select };
})();
if (typeof module !== "undefined") module.exports = LabState;
