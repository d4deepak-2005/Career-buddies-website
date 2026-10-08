import { Schema, model, type InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    /** Lower-case unique key derived from the name; makes the category list controlled. */
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    active: { type: Boolean, required: true, default: true },
    /** True only for categories inserted by `npm run seed:dev-categories`. Never assumed by any logic. */
    isDevSeed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export const Category = model('Category', categorySchema);

export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}
