import type { Database } from "~/types/supabase";

export const useCommunity = () => {
  const supabase = useSupabaseClient<Database>();
  const { userId } = useAuth();

  const getCommunity = async (id: number) => {
    const { data, error } = await supabase
      .from("community")
      .select("*, owner:user!owner_id(id, username, avatar, use)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  };

  // composables/useCommunity.ts
  const getMembers = async (communityId: number, roleFilter?: string) => {
    let query = supabase
      .from("subscribers")
      .select(
        `
      user_id,
      role,
      user:user(id, username, avatar, use, auth_uid)
    `,
      )
      .eq("communities_id", communityId);
    if (roleFilter) query = query.eq("role", roleFilter);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };
  const updateCommunity = async (id: number, updates: any) => {
    const { data, error } = await supabase
      .from("community")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const join = async (communityId: number) => {
    if (!userId.value) throw new Error("Not authenticated");
    const { error } = await supabase.from("subscribers").upsert(
      {
        communities_id: communityId,
        user_id: userId.value,
        role: "pending",
      },
      { onConflict: "user_id, communities_id", ignoreDuplicates: false },
    );
    if (error) throw error;
  };

  const leave = async (communityId: number) => {
    if (!userId.value) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("communities_id", communityId)
      .eq("user_id", userId.value);
    if (error) throw error;
  };

  const approve = async (communityId: number, targetUserId: number) => {
    const { error } = await supabase
      .from("subscribers")
      .update({ role: "member" })
      .eq("communities_id", communityId)
      .eq("user_id", targetUserId);
    if (error) throw error;
  };

  const reject = async (communityId: number, targetUserId: number) => {
    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("communities_id", communityId)
      .eq("user_id", targetUserId);
    if (error) throw error;
  };

  const getMessages = async (communityId: number, limit = 50) => {
    const { data, error } = await supabase
      .from("community_messages")
      .select("*, user:user(id, username, avatar)")
      .eq("community_id", communityId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  };

  const sendMessage = async (communityId: number, text: string) => {
    if (!userId.value) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("community_messages")
      .insert({ community_id: communityId, user_id: userId.value, text })
      .select("*, user:user(id, username, avatar)")
      .single();
    if (error) throw error;
    return data;
  };

  const createCommunity = async (data: any) => {
    const { data: newComm, error } = await supabase
      .from("community")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    // Автоматически добавляем создателя как админа
    await supabase.from("subscribers").insert({
      communities_id: newComm.id,
      user_id: data.owner_id,
      role: "admin",
    });
    return newComm;
  };

  return {
    getCommunity,
    getMembers,
    join,
    leave,
    approve,
    reject,
    getMessages,
    sendMessage,
    createCommunity,
    updateCommunity,
  };
};
