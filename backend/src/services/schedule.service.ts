// schedule.service.ts
import type { Question, Requirement, ScheduleDay } from "../types/kit";

export interface ScheduleResult {
  days_available: number;
  days: ScheduleDay[];
}

function getQuestionScore(
  question: Question,
  requirementsById: Map<string, Requirement>,
) {
  const requirements = question.requirement_ids
    .map((id) => requirementsById.get(id))
    .filter((requirement): requirement is Requirement => Boolean(requirement));

  const hasMustRequirement = requirements.some(
    (requirement) => requirement.priority === "must",
  );

  return {
    question,
    priorityScore: hasMustRequirement ? 2 : 1,
    difficultyScore: question.difficulty,
  };
}

function buildDayFocus(
  questions: Question[],
  requirementsById: Map<string, Requirement>,
  day: number,
): string {
  const labels = new Set<string>();

  for (const question of questions) {
    for (const requirementId of question.requirement_ids) {
      const requirement = requirementsById.get(requirementId);

      if (requirement) {
        labels.add(requirement.text);
      }
    }
  }

  const focusItems = Array.from(labels).slice(0, 3);

  if (focusItems.length === 0) {
    return `Interview preparation — Day ${day}`;
  }

  return focusItems.join(", ");
}

export function allocateSchedule(
  questions: Question[],
  requirements: Requirement[],
  daysAvailable: number,
): ScheduleResult {
  if (daysAvailable < 1) {
    throw new Error("DAYS_AVAILABLE_MUST_BE_POSITIVE");
  }

  const requirementsById = new Map(
    requirements.map((requirement) => [requirement.id, requirement]),
  );

  const days: ScheduleDay[] = Array.from(
    { length: daysAvailable },
    (_, index) => ({
      day: index + 1,
      focus: `Interview preparation — Day ${index + 1}`,
      question_ids: [],
      minutes: 0,
    }),
  );

  if (questions.length === 0) {
    return {
      days_available: daysAvailable,
      days,
    };
  }

  const scoredQuestions = questions
    .map((question) => getQuestionScore(question, requirementsById))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }

      if (b.difficultyScore !== a.difficultyScore) {
        return b.difficultyScore - a.difficultyScore;
      }

      return a.question.id.localeCompare(b.question.id);
    });

  // Earlier days receive more questions.
  const weights = Array.from(
    { length: daysAvailable },
    (_, index) => daysAvailable - index,
  );

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const questionCount = scoredQuestions.length;

  const baseCount = Math.floor(questionCount / daysAvailable);

  const remainder = questionCount % daysAvailable;

  const targetCounts = Array.from(
    { length: daysAvailable },
    (_, index) => baseCount + (index < remainder ? 1 : 0),
  );

  let assignedCount = targetCounts.reduce((sum, count) => sum + count, 0);

  let dayIndex = 0;

  while (assignedCount < questionCount) {
    targetCounts[dayIndex % daysAvailable] += 1;
    assignedCount += 1;
    dayIndex += 1;
  }

  let questionIndex = 0;

  for (let day = 0; day < daysAvailable; day++) {
    const count = targetCounts[day];

    const dayQuestions = scoredQuestions
      .slice(questionIndex, questionIndex + count)
      .map((item) => item.question);

    questionIndex += count;

    days[day].question_ids = dayQuestions.map((question) => question.id);

    days[day].minutes = dayQuestions.length * 10;

    days[day].focus = buildDayFocus(dayQuestions, requirementsById, day + 1);
  }

  return {
    days_available: daysAvailable,
    days,
  };
}
