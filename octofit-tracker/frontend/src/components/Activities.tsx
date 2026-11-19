import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { EmptyState, ErrorAlert, Loading, errorMessage } from './PageState.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => { if (active) setActivities(data.activities); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p className="text-muted">Student activity minutes and points.</p>
        {error ? <ErrorAlert message={error} />
          : activities === null ? <Loading label="activities" />
          : activities.length === 0 ? <EmptyState message="No activities logged yet." />
          : (
            <table className="table table-striped mb-0">
              <thead><tr><th scope="col">Type</th><th scope="col">Minutes</th><th scope="col">Points</th><th scope="col">Date</th></tr></thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr key={activity._id ?? index}>
                    <td>{activity.type}</td>
                    <td>{activity.minutes}</td>
                    <td>{activity.points}</td>
                    <td>{activity.occurredAt ? new Date(activity.occurredAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </section>
  );
}
