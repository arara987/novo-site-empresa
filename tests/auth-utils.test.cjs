const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const utils = require('../belfort-auth-utils.js');

test('generateSecurityCode returns a mixed 18-character code', () => {
  const code = utils.generateSecurityCode(() => 0.75);
  assert.equal(code.length, 18);
  assert.match(code, /[a-z]/);
  assert.match(code, /[A-Z]/);
  assert.match(code, /[0-9]/);
  assert.equal(utils.isStrongSecurityCode(code), true);
});

test('sha256Hex returns deterministic SHA-256 hex', async () => {
  const expected = crypto.createHash('sha256').update('Belfort123').digest('hex');
  assert.equal(await utils.sha256Hex('Belfort123'), expected);
});

test('parseCurrencyValue converts Brazilian currency text to number', () => {
  assert.equal(utils.parseCurrencyValue('R$ 1.234,56'), 1234.56);
  assert.equal(utils.parseCurrencyValue('2500'), 2500);
  assert.equal(utils.parseCurrencyValue(''), 0);
});

test('splitClienteDocumento extracts document type and digits', () => {
  assert.deepEqual(utils.splitClienteDocumento('CPF: 123.456.789-00'), {
    tipo: 'CPF',
    numero: '12345678900'
  });
  assert.deepEqual(utils.splitClienteDocumento('CNPJ: 12.345.678/0001-99'), {
    tipo: 'CNPJ',
    numero: '12345678000199'
  });
});

test('normalizeDate returns null for empty values and preserves filled dates', () => {
  assert.equal(utils.normalizeDate(''), null);
  assert.equal(utils.normalizeDate(undefined), null);
  assert.equal(utils.normalizeDate('2026-05-24'), '2026-05-24');
});

test('parseInteger clamps invalid or negative inventory values', () => {
  assert.equal(utils.parseInteger('12'), 12);
  assert.equal(utils.parseInteger('-4'), 0);
  assert.equal(utils.parseInteger('abc'), 0);
});

test('index initializes state before first state-dependent render call', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const stateIndex = html.indexOf('const state = {');
  const initializationIndex = html.indexOf('// ========== INICIALIZAÇÃO ==========');
  assert.ok(stateIndex > -1, 'state object must exist');
  assert.ok(initializationIndex > stateIndex, 'initialization block must run after state object');

  for (const call of ['renderNotifications();', 'renderEstoque();', 'updateEpiRegistradosCount();', 'updateClienteCards();', 'renderClientesList();', 'renderObrasDoCliente();', 'updateObraOptions();']) {
    const callIndex = html.indexOf(call, initializationIndex);
    assert.ok(callIndex > initializationIndex, `${call} must run in the post-state initialization block`);
  }
});

test('index includes Supabase persistence for document updates', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /BelfortSupabase\.upsertObraDocumentos/);
  assert.match(html, /function collectDocumentChecklist/);
});

test('index no longer persists CND only in localStorage', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /saveCndToLocalStorage\(\);/);
  assert.doesNotMatch(html, /localStorage\.setItem\('cnd'/);
});

test('index includes Supabase persistence for attachments metadata', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /BelfortSupabase\.insertDocumentoAnexos/);
});
