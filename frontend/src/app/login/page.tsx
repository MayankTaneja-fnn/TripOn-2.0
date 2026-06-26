import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex justify-center items-center min-h-[calc(100vh-64px)] px-4 overflow-hidden animate-travel-haze">
      {/* Form */}
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
