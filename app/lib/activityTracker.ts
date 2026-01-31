import { getSupabaseClient } from "./supabaseClient";

type LessonActivityAction = "start" | "complete" | "hint" | "count" | string;

type LessonActivityPayload = {
  lesson: string;
  action: LessonActivityAction;
  metadata?: Record<string, string>;
};

export const recordLessonActivity = async ({
  lesson,
  action,
  metadata,
}: LessonActivityPayload) => {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const payload = {
    lesson,
    action,
    metadata,
    recorded_at: new Date().toISOString(),
  };

  const { error } = await client.from("lesson_activity").insert(payload);
  if (error) {
    console.warn("Unable to record lesson activity:", error.message);
  }
  return error;
};
