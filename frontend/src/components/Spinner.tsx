export function Spinner({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
  return (
    <span
      className={`spinner${size === 'lg' ? ' spinner--lg' : ''}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label="Loading"
    />
  );
}
