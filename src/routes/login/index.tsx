import { createFileRoute } from "@tanstack/react-router";
import { handleSignIn } from "../../database/auth";

export const Route = createFileRoute("/login/")({
  component: LoginComponent,
});

function LoginComponent() {
  return (
    <div>
      <button className="text-24" onClick={handleSignIn}>
        Login
      </button>
    </div>
  );
}
