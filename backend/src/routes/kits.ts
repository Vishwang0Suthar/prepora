// import { Router } from "express";
// import { normalizeGenerationError } from "../services/generation-error";
// import {
//   createKit,
//   getKit,
//   markKitReady,
//   markKitFailed,
//   updateKitProgress,
//   getKits,
// } from "../services/kit.service";
// import {
//   updateQuestion,
//   createQuestion,
//   deleteQuestion,
// } from "../services/builder.service";

// import {
//   updateQuestionSchema,
//   createQuestionSchema,
// } from "../validators/builder.validator";
// import { runPipeline } from "../services/generation.service";

// import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

// import { createKitRequestSchema } from "../validators/kit-request.validator";

// const router = Router();

// router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
//   try {
//     if (!req.userId) {
//       return res.status(401).json({
//         ok: false,
//         error: "UNAUTHORIZED",
//       });
//     }

//     const kits = await getKits(req.userId);

//     return res.status(200).json({
//       ok: true,
//       kits: kits.map((kit) => ({
//         id: kit.id,
//         company: kit.company,
//         role: kit.role_title,
//         status: kit.status,
//         days_available: kit.days_requested,
//         created_at: kit.created_at,
//       })),
//     });
//   } catch (error) {
//     console.error("GET /api/kits failed:", error);

//     return res.status(500).json({
//       ok: false,
//       error: "KITS_RETRIEVAL_FAILED",
//     });
//   }
// });

// router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
//   try {
//     if (!req.userId) {
//       return res.status(401).json({
//         ok: false,
//         error: "UNAUTHORIZED",
//       });
//     }

//     const kitId = Array.isArray(req.params.id)
//       ? req.params.id[0]
//       : req.params.id;

//     if (!kitId) {
//       return res.status(400).json({
//         ok: false,
//         error: "INVALID_KIT_ID",
//       });
//     }

//     const kit = await getKit(kitId, req.userId);

//     if (!kit) {
//       return res.status(404).json({
//         ok: false,
//         error: "KIT_NOT_FOUND",
//       });
//     }

//     return res.status(200).json({
//       ok: true,
//       kit: {
//         id: kit.id,
//         status: kit.status,
//         company: kit.company,
//         company_url: kit.company_url,
//         role: kit.role_title,
//         location: kit.location,
//         days_available: kit.days_requested,
//         jd_text: kit.jd_text,
//         kit: kit.kit_json,
//         error:
//           kit.error_code || kit.error_message
//             ? {
//                 code: kit.error_code,
//                 message: kit.error_message,
//               }
//             : null,
//         progress_step: kit.progress_step,
//         created_at: kit.created_at,
//         updated_at: kit.updated_at,
//       },
//     });
//   } catch (error) {
//     console.error("GET /api/kits/:id failed:", error);

//     return res.status(500).json({
//       ok: false,
//       error: "KIT_RETRIEVAL_FAILED",
//     });
//   }
// });

// router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
//   try {
//     const parsed = createKitRequestSchema.safeParse(req.body);

//     if (!parsed.success) {
//       return res.status(400).json({
//         ok: false,
//         error: "INVALID_REQUEST",
//         details: parsed.error.flatten(),
//       });
//     }

//     if (!req.userId) {
//       return res.status(401).json({
//         ok: false,
//         error: "UNAUTHORIZED",
//       });
//     }

//     const kit = await createKit(parsed.data, req.userId);

//     try {
//       const generatedKit = await runPipeline(
//         {
//           company: parsed.data.company,
//           company_url: parsed.data.company_url,
//           role: parsed.data.role,
//           location: parsed.data.location,
//           jd_text: parsed.data.jd_text,
//           days_available: parsed.data.days_available,
//         },
//         (step) =>
//           updateKitProgress(kit.id, req.userId!, step).catch((error) => {
//             console.error(`Failed to update kit progress (${step}):`, error);
//           }),
//       );

//       const readyKit = await markKitReady(kit.id, req.userId, generatedKit);

//       return res.status(201).json({
//         ok: true,
//         kit: readyKit,
//       });
//     } catch (error) {
//       console.error("Kit generation failed:", error);

//       const normalized = normalizeGenerationError(error);

//       await markKitFailed(
//         kit.id,
//         req.userId,
//         normalized.code,
//         normalized.message,
//       );

//       return res.status(500).json({
//         ok: false,
//         error: normalized.code,
//         message: normalized.message,
//       });
//     }
//   } catch (error) {
//     console.error("POST /api/kits failed:", error);

//     return res.status(500).json({
//       ok: false,
//       error: "KIT_CREATION_FAILED",
//     });
//   }
// });

// export default router;

// kits.ts
import { Router, type Response } from "express";
import { z } from "zod";
import type { QuestionCategory } from "../types/kit";
import {
  regenerateCompanyBrief,
  regenerateRequirement,
  regenerateSchedule,
  regenerateQuestionCategory,
} from "../services/regeneration.service";
import { normalizeGenerationError } from "../services/generation-error";

import {
  createKit,
  getKit,
  markKitReady,
  markKitFailed,
  updateKitProgress,
  getKits,
} from "../services/kit.service";
import {
  upsertPracticeProgress,
  getPracticeProgress,
} from "../services/practice.service";

import { updatePracticeProgressSchema } from "../validators/practice.validator";
import {
  updateQuestion,
  createQuestion,
  deleteQuestion,
  reorderQuestions,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  reorderFlashcards,
} from "../services/builder.service";

import {
  updateQuestionSchema,
  createQuestionSchema,
  reorderQuestionsSchema,
  createFlashcardSchema,
  updateFlashcardSchema,
  reorderFlashcardsSchema,
} from "../validators/builder.validator";
import { runPipeline } from "../services/generation.service";

import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

import { createKitRequestSchema } from "../validators/kit-request.validator";

import { KitValidationError } from "../services/final-kit.service";

const router = Router();

/**
 * GET /api/kits
 *
 * Get all kits belonging to the
 * authenticated user.
 */
router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kits = await getKits(req.userId);

      return res.status(200).json({
        ok: true,
        kits: kits.map((kit) => ({
          id: kit.id,
          company: kit.company,
          role: kit.role_title,
          status: kit.status,
          days_available: kit.days_requested,
          created_at: kit.created_at,
        })),
      });
    } catch (error) {
      console.error("GET /api/kits failed:", error);

      return res.status(500).json({
        ok: false,
        error: "KITS_RETRIEVAL_FAILED",
      });
    }
  },
);

router.post(
  "/:id/regenerate/questions/:category",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const category = Array.isArray(req.params.category)
        ? req.params.category[0]
        : req.params.category;

      if (!kitId || !category) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
        });
      }

      const allowedCategories: QuestionCategory[] = [
        "technical",
        "behavioural",
        "system-design",
        "company-fit",
      ];

      if (!allowedCategories.includes(category as QuestionCategory)) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_CATEGORY",
        });
      }

      const result = await regenerateQuestionCategory(
        kitId,
        req.userId,
        category as QuestionCategory,
      );

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error("POST regenerate question category failed:", error);

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "REGENERATION_FAILED",
      });
    }
  },
);
/**
 * PATCH /api/kits/:id/questions/reorder
 */
router.patch(
  "/:id/questions/reorder",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const input = reorderQuestionsSchema.parse(req.body);

      const questions = await reorderQuestions(
        kitId,
        req.userId,
        input.question_ids,
      );

      return res.status(200).json({
        ok: true,
        questions,
      });
    } catch (error) {
      console.error("PATCH question reorder failed:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: error.issues,
        });
      }

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);
/**
 * POST /api/kits/:id/flashcards
 */
router.post(
  "/:id/flashcards",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const input = createFlashcardSchema.parse(req.body);

      const flashcard = await createFlashcard(kitId, req.userId, input);

      return res.status(201).json({
        ok: true,
        flashcard,
      });
    } catch (error) {
      console.error("POST flashcard failed:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: error.issues,
        });
      }

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * PATCH /api/kits/:id/flashcards/:flashcardId
 */
router.patch(
  "/:id/flashcards/:flashcardId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const flashcardId = Array.isArray(req.params.flashcardId)
        ? req.params.flashcardId[0]
        : req.params.flashcardId;

      if (!kitId || !flashcardId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const input = updateFlashcardSchema.parse(req.body);

      const flashcard = await updateFlashcard(
        kitId,
        req.userId,
        flashcardId,
        input,
      );

      return res.status(200).json({
        ok: true,
        flashcard,
      });
    } catch (error) {
      console.error("PATCH flashcard failed:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: error.issues,
        });
      }

      if (error instanceof KitValidationError) {
        const status =
          error.code === "FLASHCARD_NOT_FOUND" || error.code === "KIT_NOT_FOUND"
            ? 404
            : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * DELETE /api/kits/:id/flashcards/:flashcardId
 */
router.delete(
  "/:id/flashcards/:flashcardId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const flashcardId = Array.isArray(req.params.flashcardId)
        ? req.params.flashcardId[0]
        : req.params.flashcardId;

      if (!kitId || !flashcardId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const result = await deleteFlashcard(kitId, req.userId, flashcardId);

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error("DELETE flashcard failed:", error);

      if (error instanceof KitValidationError) {
        const status =
          error.code === "FLASHCARD_NOT_FOUND" || error.code === "KIT_NOT_FOUND"
            ? 404
            : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * PATCH /api/kits/:id/flashcards/reorder
 */
router.patch(
  "/:id/flashcards/reorder",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const input = reorderFlashcardsSchema.parse(req.body);

      const flashcards = await reorderFlashcards(
        kitId,
        req.userId,
        input.flashcard_ids,
      );

      return res.status(200).json({
        ok: true,
        flashcards,
      });
    } catch (error) {
      console.error("PATCH flashcard reorder failed:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: error.issues,
        });
      }

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * POST /api/kits/:id/regenerate/company-brief
 */
router.post(
  "/:id/regenerate/company-brief",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const companyBrief = await regenerateCompanyBrief(kitId, req.userId);

      return res.status(200).json({
        ok: true,
        company_brief: companyBrief,
      });
    } catch (error) {
      console.error("POST regenerate company brief failed:", error);

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "REGENERATION_FAILED",
      });
    }
  },
);

/**
 * POST /api/kits/:id/regenerate/requirements/:requirementId
 */
router.post(
  "/:id/regenerate/requirements/:requirementId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const requirementId = Array.isArray(req.params.requirementId)
        ? req.params.requirementId[0]
        : req.params.requirementId;

      if (!kitId || !requirementId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
        });
      }

      const result = await regenerateRequirement(
        kitId,
        req.userId,
        requirementId,
      );

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error("POST regenerate requirement failed:", error);

      if (error instanceof KitValidationError) {
        const status =
          error.code === "KIT_NOT_FOUND" ||
          error.code === "REQUIREMENT_NOT_FOUND"
            ? 404
            : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "REGENERATION_FAILED",
      });
    }
  },
);

/**
 * POST /api/kits/:id/regenerate/schedule
 */
router.post(
  "/:id/regenerate/schedule",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const schedule = await regenerateSchedule(kitId, req.userId);

      return res.status(200).json({
        ok: true,
        schedule,
      });
    } catch (error) {
      console.error("POST regenerate schedule failed:", error);

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "REGENERATION_FAILED",
      });
    }
  },
);

/**
 * GET /api/kits/:id/progress
 *
 * Get practice progress for the authenticated user.
 */
router.get(
  "/:id/progress",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const progress = await getPracticeProgress(kitId, req.userId);

      return res.status(200).json({
        ok: true,
        progress,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "KIT_NOT_FOUND") {
        return res.status(404).json({
          ok: false,
          error: "KIT_NOT_FOUND",
        });
      }

      console.error("GET practice progress failed:", error);

      return res.status(500).json({
        ok: false,
        error: "PRACTICE_PROGRESS_RETRIEVAL_FAILED",
      });
    }
  },
);

/**
 * PUT /api/kits/:id/progress
 *
 * Create/update practice progress.
 */
router.put(
  "/:id/progress",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const parsed = updatePracticeProgressSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: parsed.error.flatten(),
        });
      }

      const progress = await upsertPracticeProgress(
        kitId,
        req.userId,
        parsed.data,
      );

      return res.status(200).json({
        ok: true,
        progress,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "KIT_NOT_FOUND") {
        return res.status(404).json({
          ok: false,
          error: "KIT_NOT_FOUND",
        });
      }

      console.error("PUT practice progress failed:", error);

      return res.status(500).json({
        ok: false,
        error: "PRACTICE_PROGRESS_UPDATE_FAILED",
      });
    }
  },
);

/**
 * GET /api/kits/:id
 *
 * Get one kit belonging to the
 * authenticated user.
 */
router.get(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const kit = await getKit(kitId, req.userId);

      if (!kit) {
        return res.status(404).json({
          ok: false,
          error: "KIT_NOT_FOUND",
        });
      }

      return res.status(200).json({
        ok: true,
        kit: {
          id: kit.id,
          status: kit.status,
          company: kit.company,
          company_url: kit.company_url,
          role: kit.role_title,
          location: kit.location,
          days_available: kit.days_requested,
          jd_text: kit.jd_text,
          kit: kit.kit_json,
          error:
            kit.error_code || kit.error_message
              ? {
                  code: kit.error_code,
                  message: kit.error_message,
                }
              : null,
          progress_step: kit.progress_step,
          created_at: kit.created_at,
          updated_at: kit.updated_at,
        },
      });
    } catch (error) {
      console.error("GET /api/kits/:id failed:", error);

      return res.status(500).json({
        ok: false,
        error: "KIT_RETRIEVAL_FAILED",
      });
    }
  },
);

/**
 * PATCH /api/kits/:id/questions/:questionId
 *
 * Edit or pin/unpin an existing question.
 *
 * Returns only the updated question.
 */
router.patch(
  "/:id/questions/:questionId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const questionId = Array.isArray(req.params.questionId)
        ? req.params.questionId[0]
        : req.params.questionId;

      if (!kitId || !questionId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const input = updateQuestionSchema.parse(req.body);

      const question = await updateQuestion(
        kitId,
        req.userId,
        questionId,
        input,
      );

      return res.status(200).json({
        ok: true,
        question,
      });
    } catch (error) {
      console.error("PATCH question failed:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: error.issues,
        });
      }

      if (error instanceof KitValidationError) {
        const status =
          error.code === "QUESTION_NOT_FOUND" || error.code === "KIT_NOT_FOUND"
            ? 404
            : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * POST /api/kits/:id/questions
 *
 * Add a manual question.
 *
 * Returns only the created question.
 */
router.post(
  "/:id/questions",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!kitId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const input = createQuestionSchema.parse(req.body);

      const question = await createQuestion(kitId, req.userId, input);

      return res.status(201).json({
        ok: true,
        question,
      });
    } catch (error) {
      console.error("POST question failed:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: error.issues,
        });
      }

      if (error instanceof KitValidationError) {
        const status = error.code === "KIT_NOT_FOUND" ? 404 : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * DELETE /api/kits/:id/questions/:questionId
 *
 * Delete a question and remove it
 * from the schedule.
 *
 * Returns only the deleted question ID.
 */
router.delete(
  "/:id/questions/:questionId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kitId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const questionId = Array.isArray(req.params.questionId)
        ? req.params.questionId[0]
        : req.params.questionId;

      if (!kitId || !questionId) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_KIT_ID",
        });
      }

      const result = await deleteQuestion(kitId, req.userId, questionId);

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error("DELETE question failed:", error);

      if (error instanceof KitValidationError) {
        const status =
          error.code === "QUESTION_NOT_FOUND" || error.code === "KIT_NOT_FOUND"
            ? 404
            : 400;

        return res.status(status).json({
          ok: false,
          error: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
);

/**
 * POST /api/kits
 *
 * Create an interview kit and start generation in the background.
 */
router.post(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = createKitRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST",
          details: parsed.error.flatten(),
        });
      }

      if (!req.userId) {
        return res.status(401).json({
          ok: false,
          error: "UNAUTHORIZED",
        });
      }

      const kit = await createKit(parsed.data, req.userId);

      /*
       * Start generation in the background.
       *
       * IMPORTANT:
       * Do not await this promise.
       *
       * The user only needs the kit ID at this point.
       */
      void (async () => {
        try {
          const generatedKit = await runPipeline(
            {
              company: parsed.data.company,
              company_url: parsed.data.company_url,
              role: parsed.data.role,
              location: parsed.data.location,
              jd_text: parsed.data.jd_text,
              days_available: parsed.data.days_available,
            },
            (step) =>
              updateKitProgress(kit.id, req.userId!, step).catch((error) => {
                console.error(
                  `Failed to update kit progress (${step}):`,
                  error,
                );
              }),
          );

          await markKitReady(kit.id, req.userId!, generatedKit);

          console.log(`Interview kit generation completed: ${kit.id}`);
        } catch (error) {
          console.error(`Kit generation failed for ${kit.id}:`, error);

          const normalized = normalizeGenerationError(error);

          try {
            await markKitFailed(
              kit.id,
              req.userId!,
              normalized.code,
              normalized.message,
            );
          } catch (markFailedError) {
            console.error(
              `Failed to mark kit ${kit.id} as failed:`,
              markFailedError,
            );
          }
        }
      })();

      /*
       * Return immediately after the database row exists.
       */
      return res.status(201).json({
        ok: true,
        kit: {
          id: kit.id,
          status: kit.status,
          company: kit.company,
          company_url: kit.company_url,
          role: kit.role_title,
          location: kit.location,
          days_available: kit.days_requested,
          created_at: kit.created_at,
        },
      });
    } catch (error) {
      console.error("POST /api/kits failed:", error);

      return res.status(500).json({
        ok: false,
        error: "KIT_CREATION_FAILED",
      });
    }
  },
);

export default router;
