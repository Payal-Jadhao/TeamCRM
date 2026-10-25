import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { ChevronDown, Search, X } from 'lucide-react';

export interface MultiSelectUserDropdownProps {
  label: string;
  sublabel?: string;
  placeholder?: string;
  users: User[];
  selectedIds: number[];
  onChange: (newIds: number[]) => void;
  icon?: React.ReactNode;
  accentColor?: 'indigo' | 'emerald' | 'purple';
  emptyMessage?: string;
}

export const MultiSelectUserDropdown: React.FC<MultiSelectUserDropdownProps> = ({
  label,
  sublabel,
  placeholder = 'Select team members...',
  users,
  selectedIds,
  onChange,
  icon,
  accentColor = 'purple',
  emptyMessage = 'No members found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.roleName || '').toLowerCase().includes(q) ||
      (u.teamTag || '').toLowerCase().includes(q)
    );
  });

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  const toggleUser = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = Array.from(new Set([...selectedIds, ...filteredUsers.map((u) => u.id)]));
    onChange(allIds);
  };

  const handleClearAll = () => {
    const filteredIdSet = new Set(filteredUsers.map((u) => u.id));
    onChange(selectedIds.filter((id) => !filteredIdSet.has(id)));
  };

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getBadgeStyle = () => {
    if (accentColor === 'indigo') return 'bg-indigo-50/90 text-indigo-900 border-indigo-200/80';
    if (accentColor === 'emerald') return 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80';
    return 'bg-purple-50/90 text-purple-900 border-purple-200/80';
  };

  const getAvatarBg = () => {
    if (accentColor === 'indigo') return 'bg-indigo-600';
    if (accentColor === 'emerald') return 'bg-emerald-600';
    return 'bg-purple-600';
  };

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </label>
        {sublabel && <span className="text-[11px] text-text-secondary font-normal">{sublabel}</span>}
      </div>

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3.5 py-2.5 text-xs bg-purple-50/60 hover:bg-purple-50 text-text-primary rounded-xl border ${
            isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border-custom hover:border-purple-300'
          } flex items-center justify-between transition-all cursor-pointer`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedIds.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              <span className="font-semibold text-text-primary">
                {selectedIds.length} {selectedIds.length === 1 ? 'member' : 'members'} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-primary">
                {selectedIds.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Selected Members Chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-lg text-[11px] font-medium border ${getBadgeStyle()}`}
              >
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${getAvatarBg()}`}>
                  {getInitials(u.fullName)}
                </span>
                <span className="truncate max-w-[130px]">
                  {u.fullName}
                  <span className="text-[10px] opacity-70 ml-1">
                    ({u.roleName ? u.roleName.replace('ROLE_', '') : 'Member'})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUser(u.id);
                  }}
                  className="hover:text-red-500 text-gray-400 p-0.5 rounded transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedUsers.length > 1 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-gray-400 hover:text-red-500 underline ml-1 self-center cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role or email..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:bg-white outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between px-1 text-[11px] text-gray-500 border-b border-gray-100 pb-1.5">
              <span>{filteredUsers.length} available</span>
              <button
                type="button"
                onClick={isAllSelected ? handleClearAll : handleSelectAll}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400">
                  {users.length === 0 ? emptyMessage : 'No members match your search.'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-purple-50/80 text-purple-950 font-medium'
                          : 'hover:bg-gray-50 text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-primary focus:ring-0 cursor-pointer pointer-events-none"
                          />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-text-primary">{u.fullName}</span>
                          <span className="text-[10px] text-text-secondary ml-1.5 font-normal">
                            ({u.roleName ? u.roleName.replace('ROLE_', '') : 'Member'})
                          </span>
                        </div>
                      </div>
                      {u.teamTag && (
                        <span className="text-[9px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {u.teamTag}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
