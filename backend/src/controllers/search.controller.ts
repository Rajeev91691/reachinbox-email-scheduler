import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';

export class SearchController {
  static async search(req: Request, res: Response) {
    try {
      const { q = '', status = 'ALL' } = req.query;
      const results = await ElasticsearchService.searchEmails(q as string, status as string);
      return res.json({ query: q, count: results.length, results });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
