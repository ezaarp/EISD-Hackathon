import { QuestionType, AnswerKey } from '@prisma/client';

export interface GradingResult {
  score: number;
  feedback?: string;
  breakdown?: Record<string, number>;
}

export function gradeMCQ(studentAnswer: string, answerKey: AnswerKey): GradingResult {
  // studentAnswer is index "0", "1" etc. or value depending on implementation
  // answerKey.correctAnswer is expected to be the same format
  
  const isCorrect = studentAnswer === answerKey.correctAnswer;
  return {
    score: isCorrect ? 100 : 0,
    feedback: isCorrect ? 'Correct!' : 'Incorrect. ' + (answerKey.explanation || ''),
  };
}

export function gradeCode(studentCode: string, answerKey: AnswerKey): GradingResult {
  // Simple "Rule Based" grading for Hackathon
  // In real world, this calls an isolated container or LLM API
  
  const expected = answerKey.correctAnswer;
  let score = 0;
  const breakdown: Record<string, number> = {};
  
  // 1. Exact match (Bonus)
  if (studentCode.trim() === expected.trim()) {
      return { score: 100, feedback: 'Perfect match!' };
  }

  // 2. Keyword matching (Naive)
  // If rubric exists, use it.
  if (answerKey.rubricJson) {
      try {
          const rubric = JSON.parse(answerKey.rubricJson);
          // rubric: { criteria: [{ name: 'Uses useState', weight: 0.2, keyword: 'useState' }] }
          
          if (rubric.criteria && Array.isArray(rubric.criteria)) {
              let totalWeight = 0;
              rubric.criteria.forEach((criterion: any) => {
                  const weight = criterion.weight || 0;
                  totalWeight += weight; // assuming weights sum to 1.0 or 100
                  
                  // Check keyword presence
                  const keyword = criterion.keyword || criterion.name; // simplified
                  if (studentCode.includes(keyword)) {
                      score += weight * 100;
                      breakdown[criterion.name] = weight * 100;
                  } else {
                      breakdown[criterion.name] = 0;
                  }
              });
              
              // Normalize if weights are small
              if (totalWeight <= 1) {
                  // Score is already accumulated as percent
              }
          }
      } catch (e) {
          console.error("Error parsing rubric", e);
      }
  } else {
      // Fallback: Check if it contains the function name or key parts
      if (studentCode.length > 10) score = 50; // Effort points
  }

  return {
      score: Math.min(100, Math.round(score)),
      feedback: 'Automated grading completed.',
      breakdown
  };
}

export function calculateTaskGrade(questions: any[], submissions: any[]): number {
    // Aggregate scores
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(q => {
        const sub = submissions.find(s => s.questionId === q.id);
        const maxPoints = q.points || 0;
        totalPoints += maxPoints;

        if (sub && sub.grade) {
            earnedPoints += (sub.grade.score / 100) * maxPoints;
        }
    });

    if (totalPoints === 0) return 0;
    return (earnedPoints / totalPoints) * 100;
}

