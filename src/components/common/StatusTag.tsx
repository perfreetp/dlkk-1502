import { getStatusColor, getStatusLabel } from '@/utils/date';

interface StatusTagProps {
  status: string;
  className?: string;
}

export default function StatusTag({ status, className = '' }: StatusTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
