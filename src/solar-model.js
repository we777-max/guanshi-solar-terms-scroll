import * as Astronomy from '../vendor/astronomy-engine/esm/astronomy.js';

export const GNOMON_HEIGHT = 2;
export const DATUM_Y = .3;
export const RULER_LENGTH = 6;
export const TERMS = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
export const PLACES = [
  { id: 'luoyang', name: '洛阳', latitude: 34.6, longitude: 112.5 },
  { id: 'beijing', name: '北京', latitude: 39.9, longitude: 116.4 },
  { id: 'hangzhou', name: '杭州', latitude: 30.3, longitude: 120.2 }
];
const seasons = ['春','夏','秋','冬'];
const yearCache = new Map();
const observationCache = new Map();
const rad = Math.PI / 180;
const minute = 60_000;

export function getCycle(year) {
  if (!Number.isInteger(year) || year < 2024 || year > 2030) throw new RangeError('支持 2024—2030 年节气循环');
  if (!yearCache.has(year)) {
    let start = new Date(Date.UTC(year, 1, 1));
    const result = TERMS.map((name, index) => {
      const longitude = (315 + 15 * index) % 360;
      const found = Astronomy.SearchSunLongitude(longitude, start, index === 0 ? 10 : 20);
      if (!found) throw new Error(`无法求得 ${name} 的交节时刻`);
      const term = { name, index, longitude, season: seasons[Math.floor(index / 6)], instant: found.date };
      start = new Date(found.date.getTime() + 24 * 60 * minute);
      return Object.freeze(term);
    });
    yearCache.set(year, Object.freeze(result));
  }
  return yearCache.get(year);
}

export function solarDayStart(date) {
  // All term calendar dates in this demo use UTC+8, independent of the browser timezone.
  const local = new Date(date.getTime() + 8 * 60 * minute);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 8 * 60 * minute);
}

export function observeNoon(term, place, height = GNOMON_HEIGHT) {
  if (!term?.instant || !(term.instant instanceof Date) || !Number.isFinite(term.instant.getTime())) throw new TypeError('无效交节时刻');
  if (!Number.isFinite(place?.latitude) || Math.abs(place.latitude) >= 90 || !Number.isFinite(place?.longitude) || Math.abs(place.longitude) > 180) throw new RangeError('无效观测地点');
  if (!(height > 0) || !Number.isFinite(height)) throw new RangeError('表高必须为正数');
  const key = `${term.instant.toISOString()}|${place.latitude}|${place.longitude}|${height}`;
  if (observationCache.has(key)) return observationCache.get(key);
  const observer = new Astronomy.Observer(place.latitude, place.longitude, 0);
  const start = solarDayStart(term.instant);
  const transit = Astronomy.SearchHourAngle(Astronomy.Body.Sun, observer, 0, start);
  const equator = Astronomy.Equator(Astronomy.Body.Sun, transit.time, observer, true, true);
  // Geometric centre of the Sun, without atmospheric refraction.
  const horizon = Astronomy.Horizon(transit.time, observer, equator.ra, equator.dec, null);
  const altitude = horizon.altitude;
  const azimuth = horizon.azimuth;
  const alt = altitude * rad;
  const az = azimuth * rad;
  const sunDirection = { x: Math.cos(alt) * Math.sin(az), y: Math.sin(alt), z: -Math.cos(alt) * Math.cos(az) };
  const aboveHorizon = altitude > 0;
  const shadowLength = aboveHorizon ? height / Math.tan(alt) : null;
  const shadowTip = aboveHorizon ? { x: -height * sunDirection.x / sunDirection.y, y: DATUM_Y, z: -height * sunDirection.z / sunDirection.y } : null;
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, start, 1);
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, start, 1);
  const daylightMinutes = sunrise && sunset ? (sunset.date - sunrise.date) / minute : null;
  const result = Object.freeze({ altitude, azimuth, declination: equator.dec, noon: transit.time.date, sunrise: sunrise?.date ?? null, sunset: sunset?.date ?? null, daylightMinutes, sunDirection, shadowTip, shadowLength, aboveHorizon, onRuler: aboveHorizon && Math.abs(shadowTip.x) < .52 && shadowTip.z <= 0 && -shadowTip.z <= RULER_LENGTH });
  observationCache.set(key, result);
  return result;
}

export function formatInstant(date, withYear = false) {
  const rounded = new Date(Math.round(date.getTime() / minute) * minute);
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', ...(withYear ? { year: 'numeric' } : {}), month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(rounded);
}
export function formatClock(date) {
  const rounded = new Date(Math.round(date.getTime() / minute) * minute);
  return new Intl.DateTimeFormat('zh-CN', { timeZone:'Asia/Shanghai', hour:'2-digit', minute:'2-digit', hour12:false }).format(rounded);
}
export function formatDaylight(minutes) {
  if (minutes === null) return '—';
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded/60)}时${String(rounded%60).padStart(2,'0')}分`;
}
