import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttributeValue {
  type: string;
  value: any;
}

export interface ITableRow extends Document {
  tableId: Types.ObjectId;
  attributes: Record<string, IAttributeValue>;
  createdAt: Date;
  updatedAt: Date;
}

const TableRowSchema = new Schema<ITableRow>(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

export const TableRow =
  mongoose.models.TableRow ||
  mongoose.model<ITableRow>("TableRow", TableRowSchema);
