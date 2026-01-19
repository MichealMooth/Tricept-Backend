/**
 * Reference Projects Controller
 *
 * Uses Prisma service directly for database operations.
 * File-based store has been removed.
 */
import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import * as service from '@/services/reference-projects.service';
import { RolesEnum, TopicsEnum } from '@/constants/reference-projects';

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Query schema with optional roleId and topicId parameters.
 */
const QuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  topic: z.string().optional(),
  roleId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

/**
 * Create schema with validation for all fields.
 * - short_teaser: 100-150 characters when provided
 * - short_project_description: no length limit
 */
const CreateSchema = z.object({
  person: z.string().min(1),
  project_name: z.string().min(1),
  customer: z.string().min(1),
  project_description: z.string().min(1),
  role: RolesEnum,
  activity_description: z.string().min(1),
  duration_from: z.string().min(1),
  duration_to: z.string().min(1),
  contact_person: z.string().min(1),
  approved: z.boolean(),
  topics: z.array(TopicsEnum).min(1).max(6),
  short_teaser: z
    .string()
    .min(100, 'short_teaser must be at least 100 characters')
    .max(150, 'short_teaser must not exceed 150 characters')
    .optional(),
  short_project_description: z.string().optional(),
});

/**
 * Update schema - all fields are optional for partial updates.
 */
const UpdateSchema = CreateSchema.partial();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Count sentences in text (for project_description validation).
 */
function countSentences(text: string): number {
  const parts = (text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?]+\s*/)
    .filter(Boolean);
  return parts.length;
}

// =============================================================================
// Controller Functions
// =============================================================================

/**
 * List reference projects with pagination and filtering.
 */
export async function list(req: Request, res: Response): Promise<Response> {
  const q = QuerySchema.parse(req.query);
  const result = await service.list(q);
  return res.json(result);
}

/**
 * Get a single reference project by ID.
 */
export async function getOne(req: Request, res: Response): Promise<Response> {
  const id = req.params.id;
  const item = await service.getById(id);
  if (!item) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.json(item);
}

/**
 * Create a new reference project.
 */
export async function create(req: Request, res: Response): Promise<Response> {
  const data = CreateSchema.parse(req.body);
  const s = countSentences(data.project_description);
  if (s < 3 || s > 5) {
    return res.status(400).json({ message: 'project_description must have 3-5 sentences' });
  }
  const rec = await service.create(data);
  return res.status(201).json(rec);
}

/**
 * Update an existing reference project.
 */
export async function update(req: Request, res: Response): Promise<Response> {
  const id = req.params.id;
  const patch = UpdateSchema.parse(req.body);
  if (patch.project_description != null) {
    const s = countSentences(patch.project_description);
    if (s < 3 || s > 5) {
      return res.status(400).json({ message: 'project_description must have 3-5 sentences' });
    }
  }
  const rec = await service.update(id, patch);
  if (!rec) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.json(rec);
}

/**
 * Remove a reference project by ID.
 */
export async function remove(req: Request, res: Response): Promise<Response> {
  const id = req.params.id;
  const ok = await service.remove(id);
  if (!ok) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.status(204).send();
}

/**
 * Import reference projects from Excel.
 * This endpoint is used for bulk importing projects.
 */
export async function importExcel(req: Request, res: Response): Promise<Response> {
  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ message: 'Payload must be an array' });
  }

  const results: {
    index: number;
    ok: boolean;
    error?: string;
    errors?: { field: string; column: string; message: string; expected?: string }[];
  }[] = [];
  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < body.length; i++) {
    try {
      const data = CreateSchema.parse(body[i]);
      const s = countSentences(data.project_description);
      if (s < 3 || s > 5) {
        throw new Error('project_description must have 3-5 sentences');
      }
      await service.create(data);
      okCount++;
      results.push({ index: i, ok: true });
    } catch (e: unknown) {
      failCount++;
      const columnByField: Record<string, string> = {
        person: 'Person',
        project_name: 'Projektname',
        customer: 'Kunde',
        project_description: 'Beschreibung des Projekts (3-5 Saetze)',
        role: 'Rolle im Projekt',
        activity_description: 'Beschreibung der Taetigkeit',
        duration_from: 'Laufzeit von',
        duration_to: 'Laufzeit bis',
        contact_person: 'Ansprechpartner',
        approved: 'Fuer Nutzung freigegeben',
        topics: 'Themenbereich 1-6',
        short_teaser: 'Kurzbeschreibung (100-150 Zeichen)',
        short_project_description: 'Kurze Projektbeschreibung',
      };
      const enumExpectations: Record<string, string> = {
        role: (RolesEnum._def.values as string[]).join(', '),
        topics: (TopicsEnum._def.values as string[]).join(', '),
      };

      let errors: { field: string; column: string; message: string; expected?: string }[] | undefined;
      if (e instanceof ZodError) {
        errors = e.issues.map((iss) => {
          const field = Array.isArray(iss.path) && iss.path.length ? String(iss.path[0]) : '';
          const column = columnByField[field] || field || 'Unbekannt';
          let message = 'Ungueltiger Wert';
          let expected: string | undefined;
          switch (iss.code) {
            case 'too_small':
              if (iss.type === 'string') message = 'Pflichtfeld: mindestens 1 Zeichen';
              else if (iss.type === 'array') message = 'Mindestens 1 Eintrag erforderlich';
              break;
            case 'invalid_enum_value':
              message = 'Ungueltiger Wert';
              expected = enumExpectations[field];
              break;
            case 'invalid_type':
              message = 'Ungueltiger Typ: erwartet ' + iss.expected;
              break;
            default:
              message = iss.message || 'Ungueltiger Wert';
          }
          return { field, column, message, expected };
        });
      } else if (e instanceof Error && e.message.includes('project_description')) {
        errors = [
          {
            field: 'project_description',
            column: columnByField['project_description'],
            message: 'Es sind 3-5 Saetze erforderlich.',
          },
        ];
      }
      const errorMessage = e instanceof Error ? e.message : 'unknown error';
      results.push({ index: i, ok: false, error: errorMessage, errors });
    }
  }
  return res.json({ ok: okCount, fail: failCount, results });
}
