import { getIrrigationOverview } from '$lib/server/irrigation.js';

export async function load({ locals }) {
  const overview = await getIrrigationOverview(locals.session?.accessToken);
  return { overview };
}
