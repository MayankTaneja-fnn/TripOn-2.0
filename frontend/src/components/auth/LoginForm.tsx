import { signIn } from "@/lib/auth";

export default function LoginForm() {
  return (
    <form
      action={async (formData) => {
        "use server";
        await signIn("credentials", formData);
      }}
      className="flex flex-col gap-4 p-4 border rounded"
    >
      <input name="email" type="email" placeholder="Email" required className="p-2 border" />
      <input name="password" type="password" placeholder="Password" required className="p-2 border" />
      <button type="submit" className="p-2 bg-blue-500 text-white rounded">Login</button>
      <button
        type="button"
        onClick={async () => {
          "use server";
          await signIn("google");
        }}
        className="p-2 bg-red-500 text-white rounded"
      >
        Sign in with Google
      </button>
    </form>
  );
}
