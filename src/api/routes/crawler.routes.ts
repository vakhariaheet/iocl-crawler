import { Router } from 'express';
import { CrawlerController } from '../controllers/crawler.controller.js';

const router = Router();
const controller = new CrawlerController();

router.post('/run', controller.runCrawler);
router.get('/status', controller.getCrawlerStatus);

export default router;