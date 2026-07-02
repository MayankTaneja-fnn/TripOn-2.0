"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  if (!email || !password || !username) {
    throw new Error("Missing required fields");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("users").insert([
    {
      email,
      password_hash: hashedPassword,
      username,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function login(formData: FormData) {
  const { signIn } = await import("@/lib/auth");
  await signIn("credentials", formData);
}
