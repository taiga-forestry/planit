import { createFileRoute } from "@tanstack/react-router";
import supabaseClient from "../../database/client";

export const Route = createFileRoute("/login/")({
  component: LoginComponent,
});

function LoginComponent() {
  const handleSignIn = async () => {
    const { data: _, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      throw error;
    }

    // FIXME: handle redirects, adding user to db
    // FIXME: add option to sign out eventually
  };

  return (
    <div>
      <button className="text-24" onClick={handleSignIn}>
        Login
      </button>
    </div>
  );
}
