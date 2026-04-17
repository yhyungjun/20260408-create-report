import { createRow, updateRow, listRows, findRows, getRow } from './apphub-tables';

export type PipelineStatus =
  | 'PAYMENT_COMPLETE'
  | 'FORM_SENT'
  | 'FORM_COMPLETE'
  | 'PRE_MEETING_REPORT_GENERATING'
  | 'PRE_MEETING_REPORT_READY'
  | 'MEETING_COMPLETE'
  | 'REPORT_GENERATING'
  | 'REPORT_REVIEW'
  | 'REPORT_DELIVERED';

export interface Pipeline {
  id: string;
  company_name: string;
  contact_email: string;
  contact_name: string | null;
  payment_id: string;
  questionnaire_token: string;
  questionnaire_id: string | null;
  status: PipelineStatus;
  caret_note_id: string | null;
  meeting_notes: string | null;
  report_fields: Record<string, unknown> | null;
  pdf_url: string | null;
  slack_message_ts: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listPipelines(): Promise<Pipeline[]> {
  return listRows<Pipeline>('pipelines');
}

export async function getPipeline(id: string): Promise<Pipeline> {
  return getRow<Pipeline>('pipelines', id);
}

export async function getPipelineByToken(token: string): Promise<Pipeline | null> {
  const results = await findRows<Pipeline>('pipelines', r => r.questionnaire_token === token);
  return results[0] || null;
}

export async function createPipeline(input: {
  company_name: string;
  contact_email: string;
  contact_name?: string;
  payment_id: string;
  questionnaire_token: string;
}): Promise<Pipeline> {
  return createRow<Pipeline>('pipelines', {
    ...input,
    status: 'PAYMENT_COMPLETE',
    questionnaire_id: null,
    caret_note_id: null,
    meeting_notes: null,
    report_fields: null,
    pdf_url: null,
    slack_message_ts: null,
    email_sent_at: null,
  });
}

export async function updatePipelineStatus(
  id: string,
  status: PipelineStatus,
  extra?: Record<string, unknown>,
): Promise<Pipeline> {
  return updateRow<Pipeline>('pipelines', id, { status, ...extra });
}
