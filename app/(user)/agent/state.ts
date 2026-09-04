import type { AgentAnswer } from '@/lib/agent/schema';
import type { ToolTrace } from '@/lib/agent/orchestrator';

export type AgentState = { status: 'idle' | 'success' | 'error'; error: string | null; answer: AgentAnswer | null; trace: ToolTrace[] };
export const initialAgentState: AgentState = { status: 'idle', error: null, answer: null, trace: [] };
