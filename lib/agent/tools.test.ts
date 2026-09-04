import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { agentTools, type ToolResult } from '@/lib/agent/tools';

export function agentToolsContractTests() {
  assert.equal(new Set(agentTools.map((tool) => tool.name)).size, 4);
  for (const tool of agentTools) {
    assert.equal(tool.parameters.type, 'object');
    assert.equal(tool.parameters.additionalProperties, false);
    assert.ok(tool.parameters.required);
    assert.ok(tool.roles.includes('USER'));
    assert.equal(typeof tool.run, 'function');
  }
  const missingItem = agentTools.find((tool) => tool.name === 'getShipmentTrend')?.parameters;
  assert.deepEqual(missingItem?.required, ['itemCode']);
  const unavailable: ToolResult<unknown> = { ok: true, data: [], numbers: {}, dataAsOf: null, reason: 'NO_ITEM' };
  assert.equal(unavailable.reason, 'NO_ITEM');
}

export function scmIsLoadedLazilyContractTest() {
  const source = readFileSync(resolve(process.cwd(), 'lib/scm.ts'), 'utf8');
  assert.doesNotMatch(source, /^import .*createSupabaseServerClient/m);
  assert.match(source, /await import\(['"]@\/lib\/supabase\/server['"]\)/);
}
