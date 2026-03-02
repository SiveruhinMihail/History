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

  const getUserCommunities = async (userId: number) => {
    const { data, error } = await supabase
      .from("subscribers")
      .select(
        `
        role,
        community:communities_id (
          id,
          name,
          avatar,
          description,
          rating,
          patent,
          created_at
        )
      `,
      )
      .eq("user_id", userId)
      .in("role", ["member", "admin"]); // ✅ фильтр – только участники и админы

    if (error) throw error;
    return data.map((item) => ({
      ...item.community,
      role: item.role,
    }));
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
    const { error: subError } = await supabase.from("subscribers").insert({
      communities_id: newComm.id,
      user_id: data.owner_id,
      role: "admin",
    });
    if (subError) throw subError;

    return newComm;
  };
  const getCommunityRatingHistory = async (communityId: number, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString();

    const { data, error } = await supabase
      .from("community_rating_history")
      .select("created_at, rating")
      .eq("community_id", communityId)
      .gte("created_at", start)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const map = new Map<string, number>();
    data?.forEach((item) => {
      if (!item.created_at) return; // пропускаем записи без даты
      const day = item.created_at.split("T")[0];
      map.set(day as string, item.rating);
    });

    const labels: string[] = [];
    const values: number[] = [];
    let lastValue = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      labels.push(dayStr as string);
      const val = map.get(dayStr as string);
      if (val !== undefined) {
        lastValue = val;
      }
      values.push(lastValue);
    }
    return { labels, values };
  };
  // Добавить в useCommunity.ts
  const requestVerification = async (communityId: number, name: string) => {
    if (!userId.value) throw new Error("Not authenticated");
    const { error } = await (supabase as any)
      .from("community_verification_requests")
      .insert({
        community_id: communityId,
        requester_id: userId.value,
        requested_name: name,
        status: "pending",
      });
    if (error) throw error;
  };

  const updateVerificationRequest = async (
    requestId: number,
    status: "approved" | "rejected",
    notes?: string,
  ) => {
    const { error } = await (supabase as any)
      .from("community_verification_requests")
      .update({
        status,
        moderator_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (error) throw error;

    if (status === "approved") {
      // Устанавливаем patent = true и name_locked = true для сообщества
      const { data: request } = await (supabase as any)
        .from("community_verification_requests")
        .select("community_id, requested_name")
        .eq("id", requestId)
        .single();
      if (request) {
        await supabase
          .from("community")
          .update({
            patent: true,
            name_locked: true,
            name: request.requested_name,
          })
          .eq("id", request.community_id);
      }
    }
  };

  // Проверка, может ли сообщество подать заявку (рейтинг >= 100000 и нет активной заявки)
  const canRequestVerification = async (communityId: number) => {
    const { data: community } = await supabase
      .from("community")
      .select("rating, patent, name_locked")
      .eq("id", communityId)
      .single();
    if (!community) return false;
    if (community.patent) return false; // уже есть галочка
    if (community.rating < 100000) return false; // недостаточно рейтинга

    // Проверяем, есть ли уже pending заявка
    const { data: existing } = await (supabase as any)
      .from("community_verification_requests")
      .select("id")
      .eq("community_id", communityId)
      .eq("status", "pending")
      .maybeSingle();
    return !existing;
  };
  const getVerificationRequests = async () => {
    const { data, error } = await (supabase as any)
      .from("community_verification_requests")
      .select(
        `
      id,
      created_at,
      community:community_id (
        id,
        name,
        description,
        avatar,
        rating,
        patent,
        owner:owner_id (auth_uid, use, username, avatar)
      )
    `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  };

  const approveVerification = async (requestId: number) => {
    const { error } = await (supabase as any)
      .from("community_verification_requests")
      .update({ status: "approved" })
      .eq("id", requestId);
    if (error) throw error;
    // Получаем community_id
    const { data } = await (supabase as any)
      .from("community_verification_requests")
      .select("community_id")
      .eq("id", requestId)
      .single();
    if (data) {
      await supabase
        .from("community")
        .update({ patent: true })
        .eq("id", data.community_id as number);
    }
  };

  const rejectVerification = async (requestId: number) => {
    const { error } = await (supabase as any)
      .from("community_verification_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);
    if (error) throw error;
  };

  // ==================== Запросы на смену названия ====================
  const createNameChangeRequest = async (
    communityId: number,
    newName: string,
  ) => {
    const { data, error } = await (supabase as any)
      .from("community_name_change_requests")
      .insert({
        community_id: communityId,
        requested_name: newName,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const getPendingNameChangeRequests = async () => {
    const { data, error } = await (supabase as any)
      .from("community_name_change_requests")
      .select(
        `
      *,
      community:community_id (
        id,
        name,
        avatar,
        rating,
        patent,
        owner:owner_id (auth_uid, use, username, avatar)
      )
    `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  };

  const hasActiveNameChangeRequest = async (communityId: number) => {
    const { data, error } = await (supabase as any)
      .from("community_name_change_requests")
      .select("id")
      .eq("community_id", communityId)
      .eq("status", "pending")
      .maybeSingle();
    if (error) throw error;
    return !!data;
  };

  const approveNameChangeRequest = async (requestId: number) => {
    // Получаем запрос
    const { data: req, error: fetchError } = await (supabase as any)
      .from("community_name_change_requests")
      .select("community_id, requested_name")
      .eq("id", requestId)
      .single();
    if (fetchError) throw fetchError;

    // Обновляем название сообщества
    const { error: updateError } = await supabase
      .from("community")
      .update({ name: req.requested_name })
      .eq("id", req.community_id);
    if (updateError) throw updateError;

    // Обновляем статус заявки
    const { error: reqError } = await (supabase as any)
      .from("community_name_change_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (reqError) throw reqError;
  };

  const rejectNameChangeRequest = async (
    requestId: number,
    comment?: string,
  ) => {
    const { error } = await (supabase as any)
      .from("community_name_change_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        moderator_comment: comment,
      })
      .eq("id", requestId);
    if (error) throw error;
  };
  // composables/useCommunity.ts (дополнение)
  const getUserTopCommunities = async (userId: number, limit = 3) => {
    const { data, error } = await supabase
      .from("subscribers")
      .select(
        `
      community:communities_id (
        id,
        name,
        patent,
        rating
      )
    `,
      )
      .eq("user_id", userId)
      .in("role", ["member", "admin"])
      .eq("community.patent", true)
      .order("community(rating)", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map((item) => item.community).filter((c) => c != null);
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
    getUserCommunities,
    getCommunityRatingHistory,
    requestVerification,
    canRequestVerification,
    updateVerificationRequest,
    getVerificationRequests,
    approveVerification,
    rejectVerification,
    createNameChangeRequest,
    getPendingNameChangeRequests,
    hasActiveNameChangeRequest,
    approveNameChangeRequest,
    rejectNameChangeRequest,
    getUserTopCommunities,
  };
};
