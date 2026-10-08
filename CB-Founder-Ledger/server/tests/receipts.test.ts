import { readdirSync } from 'node:fs';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { getEnv } from '../src/config/env';
import { sanitizeFileName } from '../src/lib/fileType';
import { Receipt } from '../src/models/Receipt';
import { LocalReceiptStorage } from '../src/storage/receiptStorage';
import { JPG, PDF, PNG, expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
let txId: string;

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => {
  w = await seedWorld(app);
  txId = (await w.a.post('/api/transactions').send(expensePayload(w))).body.transaction.id;
});

const upload = (agent: typeof w.a, data: Buffer, filename: string, contentType: string, id = txId) =>
  agent.post(`/api/transactions/${id}/receipts`).attach('file', data, { filename, contentType });

describe('receipt upload validation', () => {
  it('accepts PDF, JPG, JPEG and PNG and stores metadata only', async () => {
    const cases: Array<[Buffer, string, string]> = [[PDF, 'invoice.pdf', 'application/pdf'], [JPG, 'photo.jpg', 'image/jpeg'], [JPG, 'photo2.JPEG', 'image/jpeg'], [PNG, 'scan.png', 'image/png']];
    for (const [buf, name, type] of cases) {
      const r = await upload(w.a, buf, name, type);
      expect(r.status, name).toBe(201);
      expect(r.body.receipt).toMatchObject({ mimeType: type, sizeBytes: buf.length, uploadedBy: { name: 'fa' } });
      expect(r.body.receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(r.body)).not.toMatch(/storageKey/);
    }
    const doc = await Receipt.findOne().lean();
    expect(doc?.storageKey).toMatch(/^[0-9a-f-]{36}\.(pdf|jpg|png)$/);
    expect(JSON.stringify(doc)).not.toContain('%PDF'); // no file bytes in MongoDB
    expect(readdirSync(getEnv().RECEIPT_STORAGE_DIR)).toHaveLength(4);
    const d = await w.b.get(`/api/transactions/${txId}`);
    expect(d.body.transaction.receiptCount).toBe(4);
    expect(d.body.receipts).toHaveLength(4);
  });

  it('19. rejects disallowed types: wrong extension, spoofed content, wrong MIME, executables', async () => {
    const bad: Array<[Buffer, string, string]> = [
      [Buffer.from('MZ\x90\x00 exe'), 'virus.exe', 'application/octet-stream'],
      [Buffer.from('<script>alert(1)</script>'), 'x.png', 'image/png'], // png extension, html content
      [PNG, 'real-png.pdf', 'application/pdf'], // content is PNG, claims pdf
      [PNG, 'real-png.png', 'application/pdf'], // MIME mismatch
      [PDF, 'doc.docx', 'application/pdf'],
      [Buffer.from('GIF89a....'), 'a.gif', 'image/gif'],
      [PDF, 'noext', 'application/pdf'],
    ];
    for (const [buf, name, type] of bad) {
      const r = await upload(w.a, buf, name, type);
      expect(r.status, name).toBe(415);
      expect(r.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
    }
    expect(await Receipt.countDocuments()).toBe(0);
    expect(() => readdirSync(getEnv().RECEIPT_STORAGE_DIR)).toThrow(); // nothing was written
  });

  it('20. rejects files over the size limit (413) and empty files', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(getEnv().RECEIPT_MAX_BYTES + 10, 3)]);
    const r = await upload(w.a, big, 'big.png', 'image/png');
    expect(r.status).toBe(413);
    expect(r.body.error.code).toBe('FILE_TOO_LARGE');
    expect((await upload(w.a, Buffer.alloc(0), 'empty.png', 'image/png')).status).toBe(400);
    expect(await Receipt.countDocuments()).toBe(0);
  });

  it('rejects missing file, extra fields, and multiple files', async () => {
    expect((await w.a.post(`/api/transactions/${txId}/receipts`).send({})).status).toBe(400);
    expect((await w.a.post(`/api/transactions/${txId}/receipts`).field('note', 'x').attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })).status).toBe(400);
    expect((await w.a.post(`/api/transactions/${txId}/receipts`).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' }).attach('file', PNG, { filename: 'b.png', contentType: 'image/png' })).status).toBe(400);
  });

  it('only the creator or an admin may attach; voided transactions are closed', async () => {
    expect((await upload(w.b, PNG, 'a.png', 'image/png')).status).toBe(403);
    expect((await upload(w.admin, PNG, 'a.png', 'image/png')).status).toBe(201);
    await w.admin.post(`/api/transactions/${txId}/void`).send({ expectedVersion: 1, reason: 'duplicate entry' });
    expect((await upload(w.a, PNG, 'b.png', 'image/png')).status).toBe(409);
  });

  it('404 for an unknown transaction', async () => {
    expect((await upload(w.a, PNG, 'a.png', 'image/png', '64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
  });
});

describe('unsafe filenames and storage paths', () => {
  it('sanitises display names and never uses them as paths', async () => {
    for (const name of ['../../etc/passwd.png', '..\\..\\win.png', 'a/b/c.png', 'we"ird\r\n;name.png', '<img src=x onerror=1>.png']) {
      const r = await upload(w.a, PNG, name, 'image/png');
      expect(r.status, name).toBe(201);
      expect(r.body.receipt.fileName).not.toMatch(/[\\/<>"\r\n]/);
    }
    for (const f of readdirSync(getEnv().RECEIPT_STORAGE_DIR)) expect(f).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(sanitizeFileName('../../../x.pdf')).toBe('x.pdf');
    expect(sanitizeFileName('')).toBe('receipt');
    expect(sanitizeFileName('.hidden')).toBe('hidden');
  });

  it('storage layer refuses traversal and foreign keys', async () => {
    const s = new LocalReceiptStorage(getEnv().RECEIPT_STORAGE_DIR);
    for (const key of ['../x.png', '/etc/passwd', 'a.png', '00000000-0000-0000-0000-000000000000.exe', '00000000-0000-0000-0000-000000000000/../../x.pdf']) {
      await expect(s.open(key)).rejects.toThrow(/Invalid storage key/);
      await expect(s.put(key, Buffer.from('x'))).rejects.toThrow(/Invalid storage key/);
    }
  });
});

describe('receipt access', () => {
  let receiptId: string;
  beforeEach(async () => {
    receiptId = (await upload(w.a, PNG, 'scan.png', 'image/png')).body.receipt.id;
  });

  it('21. unauthorised access is rejected (anonymous, disabled user, wrong transaction)', async () => {
    const url = `/api/transactions/${txId}/receipts/${receiptId}/file`;
    expect((await request(app).get(url)).status).toBe(401);
    expect((await request(app).get(`/api/transactions/${txId}/receipts/${receiptId}`)).status).toBe(401);
    expect((await request(app).get(`/api/transactions/${txId}/receipts`)).status).toBe(401);
    const other = (await w.a.post('/api/transactions').send(expensePayload(w))).body.transaction.id;
    expect((await w.a.get(`/api/transactions/${other}/receipts/${receiptId}/file`)).status).toBe(404); // receipt belongs to another transaction
    expect((await w.a.get(`/api/transactions/${txId}/receipts/not-an-id/file`)).status).toBe(400);
  });

  it('there is no public/static URL to the file or storage directory', async () => {
    const stored = readdirSync(getEnv().RECEIPT_STORAGE_DIR)[0]!;
    for (const url of [`/receipts/${stored}`, `/uploads/${stored}`, `/api/receipts/${stored}`, `/data/receipts/${stored}`, `/api/transactions/${txId}/receipts/${stored}`]) {
      const r = await request(app).get(url);
      expect([401, 400, 404], url).toContain(r.status);
      expect(r.headers['content-type'] ?? '').not.toMatch(/image\/png/);
    }
  });

  it('22. authorised users get the file with safe headers (inline and download)', async () => {
    const url = `/api/transactions/${txId}/receipts/${receiptId}/file`;
    for (const agent of [w.a, w.b, w.admin]) {
      const r = await agent.get(url).buffer(true).parse((res, cb) => { const c: Buffer[] = []; res.on('data', (d: Buffer) => c.push(d)); res.on('end', () => cb(null, Buffer.concat(c))); });
      expect(r.status).toBe(200);
      expect(r.headers['content-type']).toBe('image/png');
      expect(r.headers['x-content-type-options']).toBe('nosniff');
      expect(r.headers['cache-control']).toBe('private, no-store');
      expect(r.headers['content-security-policy']).toMatch(/default-src 'none'/);
      expect(r.headers['content-disposition']).toMatch(/^inline; filename="scan.png"/);
      expect(Buffer.compare(r.body as Buffer, PNG)).toBe(0);
    }
    const dl = await w.a.get(`${url}?download=1`);
    expect(dl.headers['content-disposition']).toMatch(/^attachment;/);
    expect((await w.a.get(`${url}?download=2`)).status).toBe(400);
    expect((await w.a.get(`${url}?path=../../x`)).status).toBe(400);
  });

  it('metadata endpoints list upload history', async () => {
    await upload(w.admin, PDF, 'invoice.pdf', 'application/pdf');
    const list = await w.b.get(`/api/transactions/${txId}/receipts`);
    expect(list.body.receipts.map((r: { fileName: string; uploadedBy: { name: string } }) => [r.fileName, r.uploadedBy.name])).toEqual([['scan.png', 'fa'], ['invoice.pdf', 'admin']]);
    const one = await w.b.get(`/api/transactions/${txId}/receipts/${receiptId}`);
    expect(one.body.receipt).toMatchObject({ id: receiptId, fileName: 'scan.png', mimeType: 'image/png' });
    const h = await w.b.get(`/api/transactions/${txId}/history`);
    expect(h.body.history.filter((x: { action: string }) => x.action === 'receipt_added')).toHaveLength(2);
  });

  it('receipt rows cannot be removed through the API (history is kept)', async () => {
    expect((await w.admin.delete(`/api/transactions/${txId}/receipts/${receiptId}`)).status).toBe(404);
    expect(await Receipt.countDocuments()).toBe(1);
  });
});
