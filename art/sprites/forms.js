// Registry of every monster form (6 lines x 3 stages).
import fire from './species/fire.js';
import water from './species/water.js';
import grass from './species/grass.js';
import electric from './species/electric.js';
import earth from './species/earth.js';
import wind from './species/wind.js';

export const LINES = ['fire', 'water', 'grass', 'electric', 'earth', 'wind'];
export const FORMS = [...fire, ...water, ...grass, ...electric, ...earth, ...wind];
export const FORM_BY_ID = Object.fromEntries(FORMS.map(f => [f.id, f]));
