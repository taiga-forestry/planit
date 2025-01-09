import supabaseClient from "../../database/client";

const getUserByEmail = async (email: string) => {
  const { data: user, error } = await supabaseClient
    .from("users")
    .select()
    .eq("email", email)
    .single();

  if (error) {
    throw error;
  }

  return user;
};

const getFavoritesByUserID = async (userID: string) => {
  const { data: user, error } = await supabaseClient
    .from("users_favorites")
    .select()
    .eq("user_id", userID);

  if (error) {
    throw error;
  }

  return user;
};

export const usersKeyQueryPairs = {
  _base: ["users"] as const,
  getUserByEmail: {
    key: (email: string) => [...usersKeyQueryPairs._base, email],
    query: getUserByEmail,
  },
  getFavoritesByUserID: {
    key: (userID: string) => [...usersKeyQueryPairs._base, userID],
    query: getFavoritesByUserID,
  },
} as const;
