/* Static configuration: machines, shifts, reasons, targets. */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.CONFIG = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    storageKey: 'fd.v1',
    backupKey: 'fd.v1.lastBackup',
    uiKey: 'fd.ui',
    schemaVersion: 1,

    // Colors are validated with the dataviz palette validator (light + dark, CVD safe, no pink).
    machines: [
      { id: 'rondo', name: 'רונדו', ratePerHour: 1800 },
      { id: 'krumster', name: 'קרומסטר', ratePerHour: 1500 },
      { id: 'filo', name: 'פילו', ratePerHour: 900 },
      { id: 'kanol', name: 'כנול', ratePerHour: 2400 },
    ],

    shifts: [
      { id: 'morning', name: 'בוקר', start: 6, minutes: 480 },
      { id: 'evening', name: 'ערב', start: 14, minutes: 480 },
      { id: 'night', name: 'לילה', start: 22, minutes: 480 },
    ],

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

    defaultSettings: {
      plantName: 'מאפייה – קו ייצור',
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
    },

    overtimeFactor: 1.25,
    coverLookbackDays: 14,
  };
});
