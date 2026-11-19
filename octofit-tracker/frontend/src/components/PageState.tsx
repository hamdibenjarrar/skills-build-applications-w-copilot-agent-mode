type LoadingProps = { label: string };
export function Loading({ label }: LoadingProps) {
  return <p role="status" className="text-muted">Loading {label}...</p>;
}

type ErrorProps = { message: string };
export function ErrorAlert({ message }: ErrorProps) {
  return <div role="alert" className="alert alert-danger">Unable to load data: {message}</div>;
}

type EmptyProps = { message: string };
export function EmptyState({ message }: EmptyProps) {
  return <p className="text-muted fst-italic">{message}</p>;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}
