import { Schema, model } from 'mongoose';

const counterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, required: true, default: 0 } }, { collection: 'counters', versionKey: false });
export const Counter = model('Counter', counterSchema);

/** Atomic, gap-tolerant sequence (a failed insert after allocation leaves a gap, never a duplicate). */
export async function nextSequence(name: string): Promise<number> {
  const c = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return c.seq;
}
