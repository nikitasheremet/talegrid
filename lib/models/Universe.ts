import mongoose, { Schema, Document } from "mongoose";

export interface IUniverse extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const UniverseSchema = new Schema<IUniverse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Universe =
  mongoose.models.Universe ||
  mongoose.model<IUniverse>("Universe", UniverseSchema);
