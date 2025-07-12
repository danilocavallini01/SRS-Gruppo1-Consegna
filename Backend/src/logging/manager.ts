import { Entry, Logging } from '@google-cloud/logging';
import { GOOGLE_PROJECT_ID } from '../../secrets';

const logging = new Logging({ projectId: GOOGLE_PROJECT_ID });
const log = logging.log('ai-chat');

export const logChat = async (email: string, requestData: string, responseData: string, folderId: number) => {
  const metadata = {
    resource: { type: 'global' },
    severity: 'INFO',
    labels: {
      email: email,
    }
  };

  const entry: Entry = log.entry(metadata, {
    timestamp: new Date(),
    request: requestData,
    response: responseData,
    folderId: folderId
  });

  await log.write(entry);
}

export const getLoggedChat = async (email: string) => {
  const [entries] = await logging.getEntries({
    filter: `labels.email = "${email}"`,
    orderBy: 'timestamp desc',
    pageSize: 10,
  });

  return entries.map(entry => entry.data);
}