import * as fs from 'fs/promises';
import * as path from 'path';
import mjml2html from 'mjml';

export const ORGANIZATION_INVITATION_TEMPLATE = 'organization-invitation';
export const ORGANIZATION_DELETE_OTP_TEMPLATE = 'organization-delete-otp';
export const ORGANIZATION_DELETED_ACK_TEMPLATE = 'organization-deleted-ack';
export const API_KEY_CREATED_TEMPLATE = 'api-key-created';
export const API_KEY_DELETED_TEMPLATE = 'api-key-deleted';

export async function renderMailTemplate(
  template: string,
  variables: Record<string, string>,
): Promise<string> {
  let mjmlContent = await fs.readFile(
    path.join(__dirname, `${template}.mjml`),
    'utf8',
  );

  for (const [key, value] of Object.entries(variables)) {
    mjmlContent = mjmlContent.replaceAll(`{{${key}}}`, value);
  }

  const { html, errors } = await mjml2html(mjmlContent, {
    validationLevel: 'soft',
  });

  if (errors?.length) {
    throw new Error(
      `MJML template "${template}" failed: ${errors.map((e) => e.message).join('; ')}`,
    );
  }

  return html;
}
