import { Client } from '@elastic/elasticsearch';
import { config } from '../config/env';
import { prisma } from '../db/prisma';

let esClient: Client | null = null;
let esAvailable = false;

interface IndexedEmail {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  etherealPreviewUrl?: string;
}
const inMemoryIndex = new Map<string, IndexedEmail>();

try {
  esClient = new Client({ node: config.elasticsearch.node });
  esClient.ping().then(() => {
    esAvailable = true;
    console.log(`✅ Elasticsearch connected at ${config.elasticsearch.node}`);
    ensureIndex();
  }).catch(() => {
    console.log('ℹ️ Elasticsearch cluster not detected at node. Using embedded in-memory inverted search engine.');
    esAvailable = false;
  });
} catch (e) {
  esAvailable = false;
}

async function ensureIndex() {
  if (!esClient || !esAvailable) return;
  try {
    const exists = await esClient.indices.exists({ index: config.elasticsearch.index });
    if (!exists) {
      await esClient.indices.create({
        index: config.elasticsearch.index,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              senderEmail: { type: 'keyword' },
              recipientEmail: { type: 'keyword' },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              etherealPreviewUrl: { type: 'keyword' },
            }
          }
        }
      });
      console.log(`✅ Elasticsearch index '${config.elasticsearch.index}' ready`);
    }
  } catch (err) {
    console.warn('Elasticsearch index initialization notice:', err);
  }
}

export class ElasticsearchService {
  static async indexEmail(email: {
    id: string;
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
    status: string;
    scheduledAt: Date;
    sentAt?: Date | null;
    etherealPreviewUrl?: string | null;
  }) {
    const doc: IndexedEmail = {
      id: email.id,
      senderEmail: email.senderEmail,
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduledAt.toISOString(),
      sentAt: email.sentAt ? email.sentAt.toISOString() : undefined,
      etherealPreviewUrl: email.etherealPreviewUrl || undefined,
    };

    inMemoryIndex.set(email.id, doc);

    if (esClient && esAvailable) {
      try {
        await esClient.index({
          index: config.elasticsearch.index,
          id: email.id,
          document: doc,
        });
      } catch (err) {
        console.warn('Elasticsearch index error:', err);
      }
    }
  }

  static async searchEmails(query: string, statusFilter?: string) {
    const q = (query || '').trim().toLowerCase();

    if (esClient && esAvailable && q) {
      try {
        const must: any[] = [
          {
            multi_match: {
              query: q,
              fields: ['subject^3', 'recipientEmail^2', 'senderEmail^2', 'body'],
              fuzziness: 'AUTO'
            }
          }
        ];
        if (statusFilter && statusFilter !== 'ALL') {
          must.push({ term: { status: statusFilter } });
        }

        const res = await esClient.search({
          index: config.elasticsearch.index,
          query: { bool: { must } }
        });
        return res.hits.hits.map(h => h._source);
      } catch (e) {
        console.warn('ES search fallback to DB/Memory:', e);
      }
    }

    if (!q) {
      const dbResults = await prisma.emailJob.findMany({
        where: statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {},
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return dbResults;
    }

    const matchedFromMemory = Array.from(inMemoryIndex.values()).filter(item => {
      const matchStatus = !statusFilter || statusFilter === 'ALL' || item.status === statusFilter;
      const matchQuery =
        item.subject.toLowerCase().includes(q) ||
        item.recipientEmail.toLowerCase().includes(q) ||
        item.senderEmail.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });

    if (matchedFromMemory.length > 0) {
      return matchedFromMemory;
    }

    const dbMatched = await prisma.emailJob.findMany({
      where: {
        AND: [
          statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {},
          {
            OR: [
              { subject: { contains: q } },
              { recipientEmail: { contains: q } },
              { senderEmail: { contains: q } },
              { body: { contains: q } },
            ]
          }
        ]
      },
      orderBy: { scheduledAt: 'desc' },
      take: 50
    });

    return dbMatched;
  }
}
