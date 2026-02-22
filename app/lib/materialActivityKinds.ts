export type MaterialActivityKind =
  | "moveable-alphabet"
  | "interactive-activity"
  | "tcp-picture-to-picture"
  | "tcp-label-to-picture"
  | "tcp-picture-and-label-to-picture"
  | "booklet";

export const MATERIAL_ACTIVITY_STYLES: Record<MaterialActivityKind, { label: string; className: string }> = {
  "moveable-alphabet": {
    label: "Moveable Alphabet",
    className: "border-pink-300 bg-pink-100 text-pink-900",
  },
  "interactive-activity": {
    label: "Interactive Activity",
    className: "border-stone-400 bg-stone-200 text-stone-900",
  },
  "tcp-picture-to-picture": {
    label: "TCP Picture to Picture",
    className: "border-amber-300 bg-amber-100 text-amber-900",
  },
  "tcp-label-to-picture": {
    label: "TCP Label to Picture",
    className: "border-sky-300 bg-sky-100 text-sky-900",
  },
  "tcp-picture-and-label-to-picture": {
    label: "TCP Picture & Label to Picture",
    className: "border-emerald-300 bg-emerald-100 text-emerald-900",
  },
  booklet: {
    label: "Booklet",
    className: "border-rose-300 bg-rose-100 text-rose-900",
  },
};
