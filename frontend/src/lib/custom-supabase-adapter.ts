import { Adapter } from "@auth/core/adapters";
import { SupabaseClient } from "@supabase/supabase-js";

export function CustomSupabaseAdapter(supabase: SupabaseClient): Adapter {
  return {
    async createUser(user) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: user.email,
          name: user.name,
          email_verified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        image: data.image,
      } as any;
    },
    async getUser(id) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        image: data.image,
      } as any;
    },
    async getUserByEmail(email) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        image: data.image,
      } as any;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const { data, error } = await supabase
        .from("accounts")
        .select("users (*)")
        .match({ provider, provider_account_id: providerAccountId })
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.users) return null;
      const user = Array.isArray(data.users) ? data.users[0] : data.users;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        image: user.image,
      } as any;
    },
    async updateUser(user) {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: user.name,
          email_verified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: data.email_verified ? new Date(data.email_verified) : null,
        image: data.image,
      } as any;
    },
    async deleteUser(userId) {
      await supabase.from("users").delete().eq("id", userId);
    },
    async linkAccount(account) {
      const { error } = await supabase.from("accounts").insert({
        user_id: account.userId,
        type: account.type,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
      if (error) throw error;
      return account as any;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await supabase
        .from("accounts")
        .delete()
        .match({ provider, provider_account_id: providerAccountId });
    },
    async createSession({ sessionToken, userId, expires }) {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ session_token: sessionToken, user_id: userId, expires: expires.toISOString() })
        .select()
        .single();
      if (error) throw error;
      return {
        sessionToken: data.session_token,
        userId: data.user_id,
        expires: new Date(data.expires),
      } as any;
    },
    async getSessionAndUser(sessionToken) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("session_token", sessionToken)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const user = Array.isArray(data.users) ? data.users[0] : data.users;
      return {
        session: {
          sessionToken: data.session_token,
          userId: data.user_id,
          expires: new Date(data.expires),
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.email_verified ? new Date(user.email_verified) : null,
          image: user.image,
        },
      } as any;
    },
    async updateSession(session) {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          expires: session.expires?.toISOString(),
        })
        .eq("session_token", session.sessionToken)
        .select()
        .single();
      if (error) throw error;
      return {
        sessionToken: data.session_token,
        userId: data.user_id,
        expires: new Date(data.expires),
      } as any;
    },
    async deleteSession(sessionToken) {
      await supabase.from("sessions").delete().eq("session_token", sessionToken);
    },
    async createVerificationToken(token) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .insert({
          identifier: token.identifier,
          token: token.token,
          expires: token.expires.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      };
    },
    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .delete()
        .match({ identifier, token })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      };
    },
  };
}
