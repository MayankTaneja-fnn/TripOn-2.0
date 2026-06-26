import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="relative flex justify-center items-center min-h-[calc(100vh-64px)] px-4 overflow-hidden animate-travel-haze">
      {/* Form */}
      <div className="relative z-10">
        <SignupForm />
      </div>
    </div>
  );
}
