// import NextAuth from "next-auth";
// import { SupabaseAdapter } from "@auth/supabase-adapter";
// import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";
// import { createClient } from "@supabase/supabase-js";
// import bcrypt from "bcryptjs";

// console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not Set");
// console.log("Supabase Service Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not Set");

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export const { handlers, signIn, signOut, auth } = NextAuth({
//   debug:true,
//   session: {
//   strategy: "jwt",
// },
//   adapter: SupabaseAdapter({
//     url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   }),
//   providers: [
//     Google({
//       clientId: process.env.AUTH_GOOGLE_ID,
//       clientSecret: process.env.AUTH_GOOGLE_SECRET,
//     }),
//     Credentials({
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           return null;
//         }

//         const { data: user, error } = await supabase
//           .from("users")
//           .select("*")
//           .eq("email", credentials.email)
//           .single();

//         if (error || !user) {
//           console.error("Supabase user fetch error:", error);
//           return null;
//         }

//         const isValid = await bcrypt.compare(
//           credentials.password as string,
//           user.password_hash
//         );

//         if (!isValid) {
//           return null;
//         }

//         return { id: user.id, email: user.email, name: user.username };
//       },
//     }),
//   ],
// });

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  debug: process.env.NODE_ENV === "development",

  session: {
    strategy: "jwt",
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    Credentials({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !user) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!valid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.username,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;

        if (!email) return false;

        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (!existing) {
          await supabase.from("users").insert({
            email,
            username:
              profile?.name?.replace(/\s+/g, "").toLowerCase() ??
              email.split("@")[0],
            password_hash: null,
          });
        }

        return true;
      }

      return true;
    },
  },

  pages: {
    signIn: "/login",
  },
});
