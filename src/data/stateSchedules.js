/**
 * Deep links to each state's AUTHORITATIVE NRCS payment schedule.
 *
 * WHY THIS FILE EXISTS INSTEAD OF A TABLE OF PER-STATE RATES
 * ----------------------------------------------------------
 * The obvious thing to build here is a lookup table: pick your state, get your EQIP rate. We
 * deliberately did not build that, and the reason matters.
 *
 * EQIP payment rates are set by each STATE NRCS office, revised annually, and published as
 * hundreds of practice codes across PDFs and spreadsheets whose format differs state to state.
 * Scraping 48 of those into a table would produce numbers that (a) we could not verify, (b) would
 * silently go stale every single year, and (c) a farmer might budget against. That is precisely
 * the class of plausible-looking-but-unverifiable number this entire project exists to refuse.
 *
 * So we do the honest thing instead. We show the observed NATIONAL RANGE, label it plainly as an
 * estimate, and then take the farmer ONE CLICK from their own state's published schedule — which
 * is authoritative, current, and not us guessing.
 *
 * Every URL below was checked on 2026-07-11. Six states do not publish a payment-schedule page at
 * the standard path; those fall back to the state office landing page rather than to a 404.
 */

const SCHEDULE = (slug) =>
  `https://www.nrcs.usda.gov/state-offices/${slug}/payment-schedule`;

const OFFICE = (slug) =>
  `https://www.nrcs.usda.gov/state-offices/${slug}`;

/** [postal, display name, url, hasDirectSchedulePage] */
const RAW = [
  ['AL', 'Alabama',        SCHEDULE('alabama'), true],
  ['AZ', 'Arizona',        OFFICE('arizona'), false],
  ['AR', 'Arkansas',       SCHEDULE('arkansas'), true],
  ['CA', 'California',     SCHEDULE('california'), true],
  ['CO', 'Colorado',       SCHEDULE('colorado'), true],
  ['CT', 'Connecticut',    SCHEDULE('connecticut'), true],
  ['DE', 'Delaware',       SCHEDULE('delaware'), true],
  ['FL', 'Florida',        SCHEDULE('florida'), true],
  ['GA', 'Georgia',        SCHEDULE('georgia'), true],
  ['ID', 'Idaho',          SCHEDULE('idaho'), true],
  ['IL', 'Illinois',       SCHEDULE('illinois'), true],
  ['IN', 'Indiana',        SCHEDULE('indiana'), true],
  ['IA', 'Iowa',           OFFICE('iowa'), false],
  ['KS', 'Kansas',         SCHEDULE('kansas'), true],
  ['KY', 'Kentucky',       SCHEDULE('kentucky'), true],
  ['LA', 'Louisiana',      SCHEDULE('louisiana'), true],
  ['ME', 'Maine',          SCHEDULE('maine'), true],
  ['MD', 'Maryland',       SCHEDULE('maryland'), true],
  ['MA', 'Massachusetts',  OFFICE('massachusetts'), false],
  ['MI', 'Michigan',       SCHEDULE('michigan'), true],
  ['MN', 'Minnesota',      SCHEDULE('minnesota'), true],
  ['MS', 'Mississippi',    SCHEDULE('mississippi'), true],
  ['MO', 'Missouri',       SCHEDULE('missouri'), true],
  ['MT', 'Montana',        OFFICE('montana'), false],
  ['NE', 'Nebraska',       SCHEDULE('nebraska'), true],
  ['NV', 'Nevada',         SCHEDULE('nevada'), true],
  ['NH', 'New Hampshire',  SCHEDULE('new%20hampshire'), true],
  ['NJ', 'New Jersey',     SCHEDULE('new%20jersey'), true],
  ['NM', 'New Mexico',     SCHEDULE('new%20mexico'), true],
  ['NY', 'New York',       SCHEDULE('new%20york'), true],
  ['NC', 'North Carolina', SCHEDULE('north%20carolina'), true],
  ['ND', 'North Dakota',   SCHEDULE('north%20dakota'), true],
  ['OH', 'Ohio',           SCHEDULE('ohio'), true],
  ['OK', 'Oklahoma',       SCHEDULE('oklahoma'), true],
  ['OR', 'Oregon',         SCHEDULE('oregon'), true],
  ['PA', 'Pennsylvania',   SCHEDULE('pennsylvania'), true],
  ['RI', 'Rhode Island',   'https://www.nrcs.usda.gov/contact/find-a-service-center', false],
  ['SC', 'South Carolina', SCHEDULE('south%20carolina'), true],
  ['SD', 'South Dakota',   SCHEDULE('south%20dakota'), true],
  ['TN', 'Tennessee',      SCHEDULE('tennessee'), true],
  ['TX', 'Texas',          SCHEDULE('texas'), true],
  ['UT', 'Utah',           SCHEDULE('utah'), true],
  ['VT', 'Vermont',        SCHEDULE('vermont'), true],
  ['VA', 'Virginia',       SCHEDULE('virginia'), true],
  ['WA', 'Washington',     SCHEDULE('washington'), true],
  ['WV', 'West Virginia',  SCHEDULE('west%20virginia'), true],
  ['WI', 'Wisconsin',      OFFICE('wisconsin'), false],
  ['WY', 'Wyoming',        SCHEDULE('wyoming'), true],
];

export const STATE_SCHEDULES = RAW.map(([code, name, url, direct]) => ({
  code, name, url, direct,
}));

export function scheduleFor(code) {
  return STATE_SCHEDULES.find((s) => s.code === code) ?? null;
}
