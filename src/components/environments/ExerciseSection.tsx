import type { ExerciseBlock } from '../../lib/types';
import { Exercise } from './Exercise';

interface ExerciseSectionProps {
  exercises: ExerciseBlock[];
  bookId?: string;
  chapterSection?: string;
}

export function ExerciseSection({ exercises, bookId, chapterSection }: ExerciseSectionProps) {
  return (
    <div className="exercise-section">
      <h3 className="exercise-section-header">Exercises</h3>
      <div className="exercise-grid">
        {exercises.map((ex, i) => (
          <Exercise
            key={ex.id || i}
            id={ex.id}
            number={ex.number}
            problem={ex.problem}
            content={ex.content}
            hint={ex.hint}
            variant={ex.variant}
            challenging={ex.challenging}
            bookId={bookId}
            chapterSection={chapterSection}
          />
        ))}
      </div>
    </div>
  );
}
