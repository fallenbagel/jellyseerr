import GenreSpecification from '@server/entity/AutoApproval/GenreSpecification';
import UserSpecification from '@server/entity/AutoApproval/UserSpecification';
import type { AutoApprovalRule } from '@server/lib/autoapproval';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const autoApprovalRuleRoutes = Router();

autoApprovalRuleRoutes.get('/', isAuthenticated(), async (req, res, next) => {
  try {
    const data = [
      {
        name: 'Test Rule',
        conditions: [
          new UserSpecification('is', '1'),
          new GenreSpecification('is', '16,14'),
        ],
      },
      {
        name: 'Mom',
        conditions: [
          new UserSpecification('isnot', '1'),
          new GenreSpecification('contains', '12,19,3'),
        ],
      },
    ];

    return res.status(200).json(data as AutoApprovalRule[]);
  } catch (e) {
    next({ status: 404, message: e.message });
  }
});

export default autoApprovalRuleRoutes;
