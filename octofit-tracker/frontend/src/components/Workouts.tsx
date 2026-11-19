import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { EmptyState, ErrorAlert, Loading, errorMessage } from './PageState.js';

type Suggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason: string };

// The seeded demo user; a real app would use the signed in student.
const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`)
      .then((data) => { if (active) setSuggestions(data.suggestions); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p className="text-muted">Recommended from recent activity patterns for {demoUserEmail}.</p>
        {error ? <ErrorAlert message={error} />
          : suggestions === null ? <Loading label="workout suggestions" />
          : suggestions.length === 0 ? <EmptyState message="No workout suggestions yet." />
          : (
            <div className="list-group">
              {suggestions.map((suggestion, index) => (
                <div key={suggestion._id ?? index} className="list-group-item">
                  <h3 className="h6 mb-1">{suggestion.title}</h3>
                  <p className="mb-1">{suggestion.reason}</p>
                  {suggestion.minutes ? <small className="text-muted">{suggestion.minutes} min, {suggestion.difficulty}</small> : null}
                </div>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}
