import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

/**
 * Middleware to validate UUID route parameters
 * Usage: router.get('/:id', validateUuid('id'), handler)
 */
export function validateUuid(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];

      if (!value) {
        continue; // Skip if parameter doesn't exist
      }

      const result = uuidSchema.safeParse(value);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: {
            parameter: paramName,
            value,
            message: `Invalid UUID format for parameter '${paramName}'`,
          },
        });
      }
    }

    next();
  };
}

/**
 * Validates that 'id' parameter is a valid UUID
 * Common use case helper
 */
export const validateId = validateUuid('id');
