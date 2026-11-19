import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { EmptyState, ErrorAlert, Loading, errorMessage } from './PageState.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => { if (active) setTeams(data.teams); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p className="text-muted">Teams and their members.</p>
        {error ? <ErrorAlert message={error} />
          : teams === null ? <Loading label="teams" />
          : teams.length === 0 ? <EmptyState message="No teams created yet." />
          : (
            <ul className="list-group">
              {teams.map((team, index) => (
                <li key={team._id ?? index} className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">{team.name}</span>
                  <span className="badge text-bg-primary rounded-pill">{team.members.length} members</span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </section>
  );
}
