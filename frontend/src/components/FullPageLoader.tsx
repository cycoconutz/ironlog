import { Spinner } from './Spinner';

export function FullPageLoader({ label = 'Loading your log' }: { label?: string }) {
  return (
    <div className="full-loader full-loader--page">
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}
