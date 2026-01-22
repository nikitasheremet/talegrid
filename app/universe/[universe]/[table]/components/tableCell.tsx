"use client";

import { useState } from "react";

const debounceTimeout = 1000;
let debouceTimer: NodeJS.Timeout;

export default function TablCell({
  rowId,
  cellValue,
  updateCell,
}: {
  rowId: string;
  cellValue: {
    value: string;
    id: string;
  };
  updateCell: (rowId: string, attributeName: string, value: string) => void;
}) {
  const [value, setCellValue] = useState(cellValue.value);
  ("use client");
  function updateValue(rowId: string, cellId: string, event: any) {
    clearTimeout(debouceTimer);

    debouceTimer = setTimeout(() => {
      updateCell(rowId, cellId, event.target.value);
    }, debounceTimeout);

    setCellValue(event.target.value);
  }
  return (
    <td>
      <input
        value={value}
        onChange={(event) => updateValue(rowId, cellValue.id, event)}
        suppressHydrationWarning={true}
      ></input>
    </td>
  );
}
