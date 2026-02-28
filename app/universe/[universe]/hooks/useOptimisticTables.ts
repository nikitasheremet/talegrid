"use client";

import { useOptimistic } from "react";

export interface TableListItem {
  id: string;
  name: string;
}

interface OptimisticTableInput {
  name: string;
}

function createTempTableId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `temp-${crypto.randomUUID()}`;
  }

  return `temp-${Date.now()}`;
}

export function useOptimisticTables(initialTables: TableListItem[]) {
  return useOptimistic(
    initialTables,
    (currentTables, input: OptimisticTableInput): TableListItem[] => {
      const normalizedName = input.name.trim();
      if (!normalizedName) return currentTables;

      const exists = currentTables.some(
        (table) => table.name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (exists) return currentTables;

      return [
        ...currentTables,
        { id: createTempTableId(), name: normalizedName },
      ];
    },
  );
}
