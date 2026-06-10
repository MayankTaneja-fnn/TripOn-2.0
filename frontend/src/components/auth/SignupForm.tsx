"use client";

import { signup } from "@/app/actions/auth";

export default function SignupForm() {
  return (
    <form
      action={async (formData) => {
        await signup(formData);
      }}
      className="flex flex-col gap-4 p-4 border rounded"
    >
      <input name="username" placeholder="Username" required className="p-2 border" />
      <input name="email" type="email" placeholder="Email" required className="p-2 border" />
      <input name="password" type="password" placeholder="Password" required className="p-2 border" />
      <button type="submit" className="p-2 bg-green-500 text-white rounded">Sign Up</button>
    </form>
  );
}
