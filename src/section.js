// Section at H, viewed along H → F. Section dimensions in mm, stresses in MPa.
const ExamSection = (() => {
  const layers =
      [{bottom: 0, top: 14, width: 21}, {bottom: 14, top: 50, width: 7}, {bottom: 50, top: 63, width: 49}];
  function atH(field) {
    const area = layers.reduce((sum, l) => sum + l.width * (l.top - l.bottom), 0);
    const centroid = layers.reduce((sum, l) => sum + l.width * (l.top ** 2 - l.bottom ** 2) / 2, 0) / area;
    const inertia = layers.reduce(
        (sum, l) => sum + l.width * ((l.top - centroid) ** 3 - (l.bottom - centroid) ** 3) / 3, 0);
    const yStar = 15, web = 7;
    const firstMoment = layers.reduce((sum, l) => {
      const y = Math.max(l.bottom, yStar);
      return y >= l.top ? sum : sum + l.width * (l.top - y) * ((l.top + y) / 2 - centroid);
    }, 0);
    const n = 1000 * field.N[0], t = 1000 * field.T[0], m = 1e6 * field.M[0];
    const sigma = y => n / area - m * (y - centroid) / inertia;
    const yMax = Math.abs(sigma(0)) >= Math.abs(sigma(63)) ? 0 : 63;
    const shear = t * firstMoment / (inertia * web), stress = sigma(yStar);
    return {
      area,
      centroid,
      inertia,
      firstMoment,
      n,
      t,
      m,
      yMax,
      maxStress: sigma(yMax),
      stress,
      shear,
      vonMises: Math.hypot(stress, Math.sqrt(3) * shear)
    };
  }
  return {atH};
})();
if (typeof module !== 'undefined')
  module.exports = ExamSection;
