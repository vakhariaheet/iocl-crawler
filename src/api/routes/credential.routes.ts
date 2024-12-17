import { Router } from 'express';
import { body } from 'express-validator';
import { CredentialController } from '../controllers/credential.controller.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = Router();
const controller = new CredentialController();

router.post('/',
  [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty()
  ],
  validateRequest,
  controller.updateCredentials
);

export default router;