import test from 'node:test';
import { agentSchemaContractTests } from '@/lib/agent/schema.test';
import { agentToolsContractTests, scmIsLoadedLazilyContractTest } from '@/lib/agent/tools.test';
import { llmContractTests } from '@/lib/agent/llm.test';
import { orchestratorContractTests } from '@/lib/agent/orchestrator.test';
import { guardrailContractTests } from '@/lib/agent/guardrail.test';
import { conversationTypesCompile, saveFailureKeepsAnswer, successfulSaveHasNoWarning } from '@/lib/agent/conversation.test';

test('Agent schema contract', agentSchemaContractTests);
test('Agent tool contract', agentToolsContractTests);
test('SCM lazy import contract', scmIsLoadedLazilyContractTest);
test('LLM contract', llmContractTests);
test('orchestrator contract', orchestratorContractTests);
test('guardrail contract', guardrailContractTests);
test('conversation types compile', () => { conversationTypesCompile(); });
test('conversation save failure preserves answer', saveFailureKeepsAnswer);
test('conversation success has no warning', successfulSaveHasNoWarning);
