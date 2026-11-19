import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { EmptyState, ErrorAlert, Loading, errorMessage } from './PageState.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => { if (active) setEntries(data.leaderboard); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p className="text-muted">Teams ranked by total points.</p>
        {error ? <ErrorAlert message={error} />
          : entries === null ? <Loading label="leaderboard" />
          : entries.length === 0 ? <EmptyState message="No rankings yet. Log an activity to get on the board." />
          : (
            <table className="table mb-0">
              <thead><tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Total points</th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.rank}-${entry.teamName}`}>
                    <td>#{entry.rank}</td>
                    <td>{entry.teamName}</td>
                    <td>{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </section>
  );
}
