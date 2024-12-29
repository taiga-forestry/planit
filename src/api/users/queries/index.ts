import supabaseClient from "../../../database/client";

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

export const usersKeyQueryPairs = {
  _base: ["users"] as const,
  getUserByEmail: {
    key: (email: string) => [...usersKeyQueryPairs._base, email],
    query: getUserByEmail,
  },
} as const;
