import { signOutAction } from "@/lib/auth-actions";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        로그아웃
      </button>
    </form>
  );
}
