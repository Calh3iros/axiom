"use server";

import { UIMessage } from "ai";

import { createClient } from "@/lib/supabase/server";

export async function getChats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching chats:", error);
    return [];
  }

  return data;
}

export async function getChatMessages(chatId: string): Promise<UIMessage[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((msg: any) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    parts: [{ type: "text", text: msg.content }],
  }));
}

export async function deleteChat(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Delete messages first (foreign key constraint)
  await supabase.from("messages").delete().eq("chat_id", chatId);
  const { error } = await supabase.from("chats").delete().eq("id", chatId);

  if (error) {
    console.error("Error deleting chat:", error);
    return { error: error.message };
  }

  return { success: true };
}
