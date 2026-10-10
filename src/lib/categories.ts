import type { Category } from "./types";

/** Palette for categories. Each pair is tuned for light and dark surfaces. */
export const CATEGORY_COLORS: string[] = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#c98500", // amber
  "#d55181", // magenta
  "#6250d6", // violet
  "#e34948", // red
  "#0d9488", // teal
  "#7c3aed", // purple
  "#64748b", // slate
];

const EPOCH = "2024-01-01T00:00:00.000Z";

function def(id: string, name: string, type: Category["type"], color: string): Category {
  return { id, name, type, color, archived: false, createdAt: EPOCH };
}

export const DEFAULT_CATEGORIES: Category[] = [
  def("in-client", "Client payment", "in", "#2a78d6"),
  def("in-salary", "Salary", "in", "#1baf7a"),
  def("in-advance", "Advance", "in", "#6250d6"),
  def("in-refund", "Refund", "in", "#0d9488"),
  def("in-other", "Other", "in", "#64748b"),
  def("out-rent", "Rent", "out", "#eb6834"),
  def("out-food", "Food", "out", "#c98500"),
  def("out-travel", "Travel", "out", "#d55181"),
  def("out-tools", "Tools and software", "out", "#7c3aed"),
  def("out-bills", "Bills", "out", "#e34948"),
  def("out-personal", "Personal", "out", "#2a78d6"),
  def("out-other", "Other", "out", "#64748b"),
];

export function categoriesForType(categories: Category[], type: "in" | "out", includeId?: string | null): Category[] {
  return categories.filter(
    (c) => (c.type === type || c.type === "both") && (!c.archived || c.id === includeId),
  );
}
