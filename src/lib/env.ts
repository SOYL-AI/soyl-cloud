/**
 * The shape a config reader needs from the environment.
 *
 * Not `NodeJS.ProcessEnv`: that type requires `NODE_ENV`, which forces every
 * caller — tests especially — to construct a fuller object than the function
 * actually reads. `process.env` satisfies this, and so does `{}`.
 */
export type EnvLike = Record<string, string | undefined>;
