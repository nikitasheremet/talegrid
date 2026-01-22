import mongoose, { Schema, Document, Types } from "mongoose";

export interface IColumn {
  name: string;
  type: string;
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

export const Table =
  mongoose.models.Table || mongoose.model<ITable>("Table", TableSchema);
