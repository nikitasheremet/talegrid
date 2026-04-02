import mongoose, { Schema, Document, Types } from "mongoose";

export interface IColumn {
  name: string;
  type: string;
  targetTableId?: Types.ObjectId | string;
  displayField?: string;
  options?: string[];
}

export interface ITable extends Document {
  name: string;
  universeId: Types.ObjectId;
  columns: IColumn[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    targetTableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: false,
    },
    displayField: {
      type: String,
      trim: true,
      required: false,
    },
    options: {
      type: [String],
      required: false,
      default: undefined,
    },
  },
  { _id: false },
);

const TableSchema = new Schema<ITable>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    universeId: {
      type: Schema.Types.ObjectId,
      ref: "Universe",
      required: true,
    },
    columns: [ColumnSchema],
  },
  {
    timestamps: true,
  },
);

const existingTableModel = mongoose.models.Table as
  | mongoose.Model<ITable>
  | undefined;

if (existingTableModel) {
  const columnsPath = existingTableModel.schema.path("columns") as
    | { schema?: Schema<IColumn> }
    | undefined;

  if (columnsPath?.schema && !columnsPath.schema.path("options")) {
    columnsPath.schema.add({
      options: {
        type: [String],
        required: false,
        default: undefined,
      },
    });
  }
}

export const Table =
  existingTableModel || mongoose.model<ITable>("Table", TableSchema);
