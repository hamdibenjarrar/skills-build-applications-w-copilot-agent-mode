import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

function requireObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw httpError(400, `${field} must be a valid id`);
  }
  return new Types.ObjectId(value);
}

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

// One point per active minute keeps scoring simple and easy to explain to students.
export function pointsForMinutes(minutes: number) {
  return Math.round(minutes);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = requireObjectId(body.userId, 'userId');
  const teamId = requireObjectId(body.teamId, 'teamId');
  const type = requireText(body.type, 'type');
  const minutes = Number(body.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0) throw httpError(400, 'minutes must be a positive number');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: pointsForMinutes(minutes),
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requireText(body.name, 'name');
  const mascot = requireText(body.mascot, 'mascot');
  const rawMembers = Array.isArray(body.members) ? body.members : [];
  const members = rawMembers.map((member) => requireObjectId(member, 'members'));
  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number; minutes: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' }, minutes: { $sum: '$minutes' } } },
    { $sort: { totalPoints: -1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals.map((entry, index) => ({
    teamId: entry._id.toString(),
    teamName: names.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    totalMinutes: entry.minutes,
    rank: index + 1,
  }));
}

const focusByActivityType: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  swim: 'endurance',
  walk: 'endurance',
  strength: 'strength',
  yoga: 'mobility',
  stretch: 'mobility',
};

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const counts = new Map<string, number>();
  for (const activity of recent) counts.set(activity.type, (counts.get(activity.type) ?? 0) + activity.minutes);
  const topType = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const focus = (topType && focusByActivityType[topType]) ?? user.fitnessGoal;
  const reason = topType
    ? `Your recent ${topType} activity points to a ${focus} focus`
    : `Matches your ${user.fitnessGoal} goal`;

  const workouts = await Workout.find().lean();
  const ranked = [...workouts].sort((a, b) => Number(b.focus === focus) - Number(a.focus === focus));
  return ranked.map((workout) => ({
    ...workout,
    reason: workout.focus === focus ? reason : `Adds variety to your ${focus} training`,
  }));
}

export { User };
