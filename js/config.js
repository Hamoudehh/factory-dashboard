/* Static configuration: machines, shift, reasons, targets, planning defaults. */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.CONFIG = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    storageKey: 'fd.v1',
    backupKey: 'fd.v1.lastBackup',
    uiKey: 'fd.ui',
    schemaVersion: 2,
    cloudRefreshMinutes: 5, // reload from Airtable while the page is open (PRACTICE.md)
    // Cloudflare Worker that connects the GitHub Pages copy to Airtable (worker/README.md). Empty: not set up yet.
    airtableProxyUrl: '',

    // Colors live in css/styles.css (--m-<id>), validated with the dataviz palette validator. Never pink.
    machines: [
      { id: 'rondo', name: 'רונדו', ratePerHour: 1800 },
      { id: 'krumster', name: 'קרומסטר', ratePerHour: 1500 },
      { id: 'filo', name: 'פילו', ratePerHour: 900 },
      { id: 'kanol', name: 'כנול', ratePerHour: 2400 },
      { id: 'bread', name: 'לחם', ratePerHour: 1200 },
    ],

    // One production shift. Some workers continue to the extension end (overtime).
    shifts: [{ id: 'morning', name: 'בוקר' }],
    // Sunday–Friday. Friday ends early (settings.shift.fridayEnd).
    workDays: [0, 1, 2, 3, 4, 5],
    shortDay: 5,

    // Fixed order: bars keep the same color even when sorted differently. Colors: --r-<id>.
    downtimeReasons: [
      { id: 'breakdown', name: 'תקלה' },
      { id: 'changeover', name: 'החלפת מוצר' },
      { id: 'cleaning', name: 'ניקיון' },
      { id: 'material', name: 'חוסר חומר' },
      { id: 'staff', name: 'חוסר עובדים' },
      { id: 'other', name: 'אחר' },
    ],

    attendanceStatus: [
      { id: 'present', name: 'נוכח' },
      { id: 'absent', name: 'נעדר' },
      { id: 'sick', name: 'מחלה' },
      { id: 'vacation', name: 'חופש' },
    ],

    moveTypes: [
      { id: 'in', name: 'כניסה' },
      { id: 'out', name: 'יציאה' },
      { id: 'scrap', name: 'פחת' },
      { id: 'count', name: 'ספירה' },
    ],

    itemCategories: [
      { id: 'raw', name: 'חומר גלם' },
      { id: 'packaging', name: 'אריזה' },
      { id: 'finished', name: 'מוצר מוגמר' },
    ],

    cartonUnit: 'קרטון',

    defaultSettings: {
      plantName: 'ארומה - מאפים',
      shift: { start: '06:00', end: '16:00', extendedEnd: '18:00', fridayEnd: '12:00' },
      targets: {
        oee: 0.85,
        oeeWarn: 0.65,
        scrapMax: 0.03,
        scrapWarn: 0.05,
        attendance: 0.95,
        attendanceWarn: 0.9,
        planAdherence: 0.95,
        planAdherenceWarn: 0.85,
      },
      planning: {
        targetDays: 3,
        maxProductsPerDay: 3,
        changeoverMinutes: 15,
        horizonDays: 6,
      },
    },

    overtimeFactor: 1.25,
    coverLookbackDays: 14,
  };
});
