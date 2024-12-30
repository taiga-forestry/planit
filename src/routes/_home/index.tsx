import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_home/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <>
      <Link to="/login"> Go to Login </Link>
    </>
  );
}
