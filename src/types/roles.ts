export interface Role {
  id: string;
  display_name: string;
  color: string;
  is_system: boolean;
  sort_order: number;
  created_at?: string;
}

export const ROLE_COLOR_PALETTE = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-lime-500",
  "bg-sky-500",
];
