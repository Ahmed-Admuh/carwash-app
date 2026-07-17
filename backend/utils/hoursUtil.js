// hoursUtil.js — shared logic for "is this wash open right now?"
//
// operating_hours shape:
// { "is24_7": boolean,
//   "schedule": { "monday": [{"open":"09:00","close":"11:00"}, {"open":"15:00","close":"23:59"}], ... } }
//
// Multiple periods per day are supported (e.g. a morning shift and a
// separate evening shift with a midday closure in between).
//
// Time zone: Saudi Arabia doesn't observe daylight saving and is a single
// fixed offset (UTC+3) year-round, so a fixed offset is used here rather
// than pulling in a full timezone database — accurate for this app's
// actual market and much simpler than the alternative.

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const SAUDI_UTC_OFFSET_HOURS = 3;

function nowInSaudi() {
  const utc = new Date(Date.now());
  return new Date(utc.getTime() + SAUDI_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

function isOpenNow(operatingHours) {
  if (!operatingHours) return true; // no data — assume open rather than hiding a wash incorrectly
  if (operatingHours.is24_7) return true;

  const now = nowInSaudi();
  const dayName = DAY_NAMES[now.getUTCDay()];
  const periods = (operatingHours.schedule && operatingHours.schedule[dayName]) || [];
  if (periods.length === 0) return false;

  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  return periods.some(period => {
    const [openH, openM] = period.open.split(":").map(Number);
    const [closeH, closeM] = period.close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    if (closeMinutes <= openMinutes) {
      // Crosses midnight (e.g. 20:00–02:00)
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  });
}

// Basic shape validation before saving seller-submitted hours.
function isValidOperatingHours(oh) {
  if (typeof oh !== "object" || oh === null) return false;
  if (typeof oh.is24_7 !== "boolean") return false;
  if (oh.is24_7) return true;
  if (typeof oh.schedule !== "object" || oh.schedule === null) return false;

  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
  for (const day of Object.keys(oh.schedule)) {
    if (!DAY_NAMES.includes(day)) return false;
    const periods = oh.schedule[day];
    if (!Array.isArray(periods)) return false;
    for (const p of periods) {
      if (!p || typeof p.open !== "string" || typeof p.close !== "string") return false;
      if (!timeRe.test(p.open) || !timeRe.test(p.close)) return false;
    }
  }
  return true;
}

module.exports = { isOpenNow, isValidOperatingHours, DAY_NAMES };
