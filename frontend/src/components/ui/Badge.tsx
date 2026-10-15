import React from 'react';
import { TaskPriority, TaskStatus } from '../../types';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();

  switch (s) {
    case 'DONE':
    case 'WON':
    case 'QUALIFIED':
    case 'INTEGRATED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {status}
        </span>
      );
    case 'IN_PROGRESS':
    case 'INTEGRATING':
    case 'CONTACTED':
    case 'PROPOSAL':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {status.replace('_', ' ')}
        </span>
      );
    case 'REVIEW':
    case 'NEGOTIATION':
    case 'READY_FOR_INTEGRATION':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {status.replace(/_/g, ' ')}
        </span>
      );
    case 'BLOCKED':
    case 'LOST':
    case 'CHANGE_REQUESTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {status.replace(/_/g, ' ')}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          {status.replace(/_/g, ' ')}
        </span>
      );
  }
};

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const p = priority.toUpperCase();
  switch (p) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
          URGENT
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
          MED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
          LOW
        </span>
      );
  }
};

export const TeamTagChip: React.FC<{ tag?: string }> = ({ tag }) => {
  if (!tag) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-primary uppercase tracking-wider">
      @{tag.toLowerCase()}
    </span>
  );
};
