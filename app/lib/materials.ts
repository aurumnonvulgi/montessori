import { getSupabaseClient } from "./supabaseClient";

export type Material = {
  id: string;
  name: string;
  description: string;
  ageRange?: string;
  color?: string;
  modelUrl?: string | null;
};

const fallbackMaterials: Material[] = [
  {
    id: "pink-tower",
    name: "Pink Tower",
    description: "Build visual discrimination of size with graded cubes.",
    ageRange: "2.5–4",
    color: "#eec1c4",
  },
  {
    id: "number-rods",
    name: "Number Rods",
    description: "Introduce quantity and length in a concrete way.",
    ageRange: "3–5",
    color: "#f3d27b",
  },
  {
    id: "sandpaper-letters",
    name: "Sandpaper Letters",
    description: "Trace phonetic sounds with tactile letterforms.",
    ageRange: "3–6",
    color: "#b8d8c7",
  },
  {
    id: "pouring-work",
    name: "Pouring Work",
    description: "Refine coordination with careful pouring sequences.",
    ageRange: "2–4",
    color: "#f0b39d",
  },
  {
    id: "geometric-solids",
    name: "Geometric Solids",
    description: "Explore shape vocabulary with concrete forms.",
    ageRange: "3–6",
    color: "#c1cbe5",
  },
];

export type MaterialSource = "local" | "supabase";

export type MaterialResponse = {
  materials: Material[];
  source: MaterialSource;
  supabaseConfigured: boolean;
};

export const fetchMaterials = async (): Promise<MaterialResponse> => {
  const client = getSupabaseClient();

  if (!client) {
    return {
      materials: fallbackMaterials,
      source: "local",
      supabaseConfigured: false,
    };
  }

  const { data, error } = await client
    .from("materials")
    .select("id, name, description, model_url")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      materials: fallbackMaterials,
      source: "local",
      supabaseConfigured: true,
    };
  }

  const mapped = data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    modelUrl: item.model_url,
  })) as Material[];

  return {
    materials: mapped,
    source: "supabase",
    supabaseConfigured: true,
  };
};
