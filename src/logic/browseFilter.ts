import { useSyncExternalStore } from 'react';

import { emptyFilter, toggleValue, type PageFilter } from './entryFilter';

let current: PageFilter = emptyFilter();
const listeners = new Set<() => void>();

function emit(next: PageFilter) {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): PageFilter {
  return current;
}

export function getBrowseFilter(): PageFilter {
  return current;
}

export function useBrowseFilter(): PageFilter {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function toggleFilterMood(id: string) {
  emit({ ...current, moods: toggleValue(current.moods, id) });
}

export function toggleFilterTag(name: string) {
  emit({ ...current, tags: toggleValue(current.tags, name) });
}

export function clearBrowseFilter() {
  emit(emptyFilter());
}
