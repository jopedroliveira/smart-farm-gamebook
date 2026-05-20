// Weather store — fetches from Open-Meteo and exposes current + forecast.

import { writable } from 'svelte/store';

// Map Open-Meteo WMO code to our weather kind
export function wmoToKind(code) {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export const WX_LABELS_PT = {
  sunny: 'SOL',
  partly: 'POUCAS NUVENS',
  cloudy: 'NUBLADO',
  rain: 'CHUVA',
  drizzle: 'CHUVISCO',
  storm: 'TROVOADA',
  snow: 'NEVE',
  fog: 'NEVOEIRO',
};

const PT_WEEKDAY = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function fmtWxDate(iso, today) {
  const d = new Date(iso + 'T00:00:00');
  const isToday = today && d.toDateString() === today.toDateString();
  const tomorrow = today && new Date(today.getTime() + 86400000);
  const isTomorrow = tomorrow && d.toDateString() === tomorrow.toDateString();
  if (isToday) return 'HOJE';
  if (isTomorrow) return 'AMANHÃ';
  return PT_WEEKDAY[d.getDay()] + ' ' + d.getDate();
}

export const weatherStore = writable({
  kind: 'sunny',
  weather: 'sunny',
  temp: 22,
  feels: 22,
  humidity: null,
  wind: null,
  sunrise: null,
  sunset: null,
  precipToday: 0,
});

export const forecastStore = writable([]);
export const locationStore = writable('');

// Generate farm-context advice based on weather
export function weatherAdvice(current, forecast) {
  const advice = [];
  const next3 = forecast.slice(0, 3);
  const rainSoon = next3.find(
    (d) => d.kind === 'rain' || d.kind === 'storm' || (d.precip || 0) > 60
  );

  if (current.kind === 'sunny' && current.temp >= 26) {
    advice.push({
      type: 'warn',
      icon: '☀',
      text: 'Calor — regar de manhã cedo ou ao pôr-do-sol. Vigia camas com solanáceas.',
    });
  } else if (current.kind === 'sunny') {
    advice.push({ type: 'ok', icon: '☀', text: 'Sol estável. Bom dia para sachar e mondar.' });
  } else if (current.kind === 'rain' || current.kind === 'drizzle') {
    advice.push({
      type: 'info',
      icon: '💧',
      text: 'A chover — não regues. Risco aumentado de míldio em tomate.',
    });
  } else if (current.kind === 'storm') {
    advice.push({
      type: 'warn',
      icon: '⚡',
      text: 'Trovoada — verifica tutores e rede anti-inseto. Não entrar na horta.',
    });
  } else if (current.kind === 'cloudy' || current.kind === 'partly') {
    advice.push({
      type: 'ok',
      icon: '☁',
      text: 'Tempo ameno. Janela ideal para transplantes e sementeiras.',
    });
  } else if (current.kind === 'fog') {
    advice.push({
      type: 'info',
      icon: '🌫',
      text: 'Nevoeiro — evita mexer nas folhas até secarem (propaga doenças).',
    });
  }

  if (rainSoon && current.kind !== 'rain' && current.kind !== 'storm') {
    advice.push({
      type: 'info',
      icon: '☂',
      text: `Chuva prevista ${rainSoon === forecast[0] ? 'hoje' : 'nos próximos dias'} — adia regas profundas.`,
    });
  }
  if (!rainSoon && current.kind === 'sunny') {
    advice.push({
      type: 'warn',
      icon: '🚱',
      text: 'Sem chuva prevista esta semana — reforça mulching no canteiro RB-21.',
    });
  }

  const hot = forecast.find((d) => d.max >= 30);
  if (hot) {
    advice.push({
      type: 'warn',
      icon: '🔥',
      text: `Calor extremo a chegar (${hot.max}° ${fmtWxDate(hot.date, new Date()).toLowerCase()}). Sombra parcial para alface e rúcula.`,
    });
  }

  return advice.slice(0, 4);
}

// Fetch weather — call from onMount in a component
export async function fetchWeather() {
  async function load(lat, lon) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset` +
        `&forecast_days=7&timezone=auto`;
      const r = await fetch(url);
      const data = await r.json();
      const code = data.current.weather_code;
      const kind = wmoToKind(code);
      let w = 'cloudy';
      if (kind === 'sunny') w = 'sunny';
      else if (kind === 'rain' || kind === 'drizzle') w = 'rain';
      else if (kind === 'storm') w = 'storm';
      const sunrise = (data.daily.sunrise?.[0] || '').slice(11, 16);
      const sunset = (data.daily.sunset?.[0] || '').slice(11, 16);
      weatherStore.set({
        weather: w,
        kind,
        temp: Math.round(data.current.temperature_2m),
        feels: Math.round(data.current.apparent_temperature),
        humidity: Math.round(data.current.relative_humidity_2m),
        wind: Math.round(data.current.wind_speed_10m),
        sunrise,
        sunset,
        precipToday: (data.daily.precipitation_sum?.[0] || 0).toFixed(1),
      });
      const days = (data.daily.time || []).map((date, i) => ({
        date,
        kind: wmoToKind(data.daily.weather_code[i]),
        max: Math.round(data.daily.temperature_2m_max[i]),
        min: Math.round(data.daily.temperature_2m_min[i]),
        precip: data.daily.precipitation_probability_max?.[i] ?? 0,
        rain: (data.daily.precipitation_sum?.[i] || 0).toFixed(1),
      }));
      forecastStore.set(days);
      locationStore.set(
        data.timezone?.split('/').pop()?.replace(/_/g, ' ').toUpperCase() || ''
      );
    } catch (e) {
      /* keep defaults */
    }
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => load(38.72, -9.14),
      { timeout: 4000, maximumAge: 1000 * 60 * 30 }
    );
  } else {
    await load(38.72, -9.14);
  }
}
