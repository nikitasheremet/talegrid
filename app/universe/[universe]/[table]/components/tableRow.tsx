import { useMemo } from "react";
import TableCell from "./tableCell";

export default function TableRow({
  id,
  attributes,
  updateCell,
}: {
  id: string;
  attributes: {
    [key: string]: {
      type: string;
      value: any;
    };
  };
  updateCell: (rowId: string, cellId: string, value: string) => void;
}) {
  const rowValues = useMemo(() => {
    const attributesEntries = Object.entries(attributes);

    return attributesEntries.map((attribute) => {
      return {
        id: attribute[0],
        value: attribute[1].value,
      };
    });
  }, [attributes]);

  return (
    <tr>
      {rowValues.map((value) => (
        <TableCell
          key={Math.random()}
          rowId={id}
          cellValue={value}
          updateCell={updateCell}
        />
      ))}
    </tr>
  );
}
