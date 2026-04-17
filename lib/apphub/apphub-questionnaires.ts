import { createRow, updateRow, listRows, findRows } from './apphub-tables';

export interface Questionnaire {
  id: string;
  pipeline_token: string;
  company_name: string;
  respondent_name: string | null;
  respondent_email: string | null;
  answers: Record<string, string>;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listQuestionnaires(): Promise<Questionnaire[]> {
  return listRows<Questionnaire>('questionnaires');
}

export async function getQuestionnaireByToken(token: string): Promise<Questionnaire | null> {
  const results = await findRows<Questionnaire>('questionnaires', r => r.pipeline_token === token);
  return results[0] || null;
}

export async function createQuestionnaire(input: {
  pipeline_token: string;
  company_name: string;
  respondent_name?: string;
  respondent_email?: string;
}): Promise<Questionnaire> {
  return createRow<Questionnaire>('questionnaires', {
    ...input,
    answers: {},
    status: 'IN_PROGRESS',
    submitted_at: null,
  });
}

export async function updateQuestionnaireAnswers(
  id: string,
  answers: Record<string, string>,
): Promise<Questionnaire> {
  return updateRow<Questionnaire>('questionnaires', id, { answers });
}

export async function submitQuestionnaire(id: string): Promise<Questionnaire> {
  return updateRow<Questionnaire>('questionnaires', id, {
    status: 'SUBMITTED',
    submitted_at: new Date().toISOString(),
  });
}
