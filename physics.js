/* Pure calculations. P in seconds, Pdot in s/s, DM in pc cm^-3,
   radio frequency in MHz, angles in degrees unless noted. */
const Physics = (() => {
  const TAU = 2 * Math.PI;
  const YEAR = 365.25 * 86400;
  const C = 299792458; // m/s
  const I = 1e45; // canonical g cm²; used with cgs erg/s
  const DISPERSION_K = 4.148808e6; // ms MHz² pc^-1 cm³
  const valid = (x) => Number.isFinite(x) && x > 0;
  const deg = (x) => x * Math.PI / 180;
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  const validAngle = (a) => Number.isFinite(a) && a >= 0 && a <= 180;
  function frequency(P) { return valid(P) ? 1 / P : null; }
  function characteristicAge(P, Pdot) { return valid(P) && valid(Pdot) ? P / (2 * Pdot) / YEAR : null; }
  function surfaceDipoleField(P, Pdot) { return valid(P) && valid(Pdot) ? 3.2e19 * Math.sqrt(P * Pdot) : null; }
  function spinDownLuminosity(P, Pdot) { return valid(P) && valid(Pdot) ? 4 * Math.PI ** 2 * I * Pdot / P ** 3 : null; }
  function lightCylinderRadius(P) { return valid(P) ? C * P / TAU / 1000 : null; } // km
  function observerMagneticAngle(alpha, zeta, phase) {
    if (![alpha, zeta].every(validAngle) || !Number.isFinite(phase)) return null;
    return Math.acos(clamp(Math.cos(deg(alpha)) * Math.cos(deg(zeta)) +
      Math.sin(deg(alpha)) * Math.sin(deg(zeta)) * Math.cos(phase))) * 180 / Math.PI;
  }
  function beamSeparation(alpha, zeta, phase) {
    const theta = observerMagneticAngle(alpha, zeta, phase);
    return theta === null ? null : Math.min(theta, 180 - theta); // antipodal pole
  }
  function isBeamVisible(alpha, zeta, rho) {
    if (![alpha, zeta, rho].every(validAngle) || rho <= 0) return false;
    return Math.min(Math.abs(zeta - alpha), Math.abs(180 - zeta - alpha)) < rho;
  }
  function beamResponse(alpha, zeta, rho, phase) {
    const separation = beamSeparation(alpha, zeta, phase);
    if (separation === null || !valid(rho) || separation >= rho) return 0;
    const sigma = rho / 2.4;
    const edge = Math.exp(-0.5 * (rho / sigma) ** 2);
    return (Math.exp(-0.5 * (separation / sigma) ** 2) - edge) / (1 - edge);
  }
  function dispersionDelay(dm, lowMHz, highMHz) {
    if (!Number.isFinite(dm) || dm < 0 || !valid(lowMHz) || !valid(highMHz) || lowMHz > highMHz) return null;
    return DISPERSION_K * dm * (lowMHz ** -2 - highMHz ** -2); // milliseconds
  }
  function derived(P, Pdot) {
    return { frequency: frequency(P), ageYears: characteristicAge(P, Pdot), fieldGauss: surfaceDipoleField(P, Pdot), edotErgS: spinDownLuminosity(P, Pdot), lightCylinderKm: lightCylinderRadius(P) };
  }
  return { frequency, characteristicAge, surfaceDipoleField, spinDownLuminosity,
    lightCylinderRadius, observerMagneticAngle, beamSeparation, isBeamVisible,
    beamResponse, dispersionDelay, derived, constants: { YEAR, C, I, DISPERSION_K } };
})();
if (typeof module !== "undefined") module.exports = Physics;
