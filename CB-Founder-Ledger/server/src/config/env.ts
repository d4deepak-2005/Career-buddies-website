import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGO_URI: z
      .string()
      .min(1, 'MONGO_URI is required')
      .refine((v) => /^mongodb(\+srv)?:\/\//.test(v), 'MONGO_URI must start with mongodb:// or mongodb+srv://'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
    COOKIE_SECURE: booleanString.optional(),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
    AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (env.COOKIE_SECURE === false) {
        ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'COOKIE_SECURE cannot be false in production' });
      }
      if (/change[-_ ]?me|placeholder|your[-_ ]?secret/i.test(env.JWT_ACCESS_SECRET)) {
        ctx.addIssue({ code: 'custom', path: ['JWT_ACCESS_SECRET'], message: 'JWT_ACCESS_SECRET looks like a placeholder' });
      }
    }
  });

export type Env = Omit<z.infer<typeof schema>, 'COOKIE_SECURE'> & { COOKIE_SECURE: boolean };

/** Parse and validate environment variables. Throws a readable error listing every problem. */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(env)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  const data = result.data;
  return { ...data, COOKIE_SECURE: data.COOKIE_SECURE ?? data.NODE_ENV === 'production' };
}

let cached: Env | undefined;

/** Lazily-validated process environment (call after dotenv has loaded). */
export function getEnv(): Env {
  cached ??= parseEnv();
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}
