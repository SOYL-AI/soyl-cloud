/**
 * Values the browser needs that the API also enforces.
 *
 * Duplicated deliberately, and only the ones that improve the form: telling
 * someone their password is too short before they submit is worth a constant
 * in two places. `services/api/soyl/domain/identity/secrets.py` remains the
 * authority — this is a hint, never a check.
 */

/** Mirrors `MIN_PASSWORD_LENGTH` in the API's `secrets.py`. */
export const MIN_PASSWORD_LENGTH = 12;
