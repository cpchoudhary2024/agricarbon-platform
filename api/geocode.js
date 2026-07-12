/**
 * Address → coordinates, via the US Census Bureau geocoder.
 *
 * Chosen over commercial geocoders because it is free, requires no API key, is authoritative for
 * US addresses, and — importantly for a public-interest tool — does not log farmer addresses to a
 * commercial data broker. Farmers' data-privacy concerns are a documented barrier to carbon market
 * participation; a tool asking for their field location should not be casual about that.
 */

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

export default async function handler(req, res) {
  const q = (req.query?.q ?? '').toString().trim();

  if (!q) {
    return json(res, 400, { error: 'Provide an address as ?q=' });
  }

  try {
    const url =
      `${CENSUS_URL}?address=${encodeURIComponent(q)}` +
      `&benchmark=Public_AR_Current&format=json`;

    const r = await fetch(url);
    const data = await r.json();

    const matches = data?.result?.addressMatches ?? [];
    if (!matches.length) {
      return json(res, 404, {
        error: 'No match for that address.',
        hint:
          'The Census geocoder matches street addresses. For a field with no address, use the ' +
          'coordinate entry instead — you can read lat/lon straight off most phone map apps by ' +
          'long-pressing the field.',
      });
    }

    return json(res, 200, {
      results: matches.slice(0, 5).map((m) => ({
        label: m.matchedAddress,
        lat: m.coordinates.y,
        lon: m.coordinates.x,
      })),
    });
  } catch (err) {
    return json(res, 502, { error: `Geocoder unavailable: ${err.message}` });
  }
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(JSON.stringify(body));
}
