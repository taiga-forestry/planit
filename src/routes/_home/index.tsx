import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_home/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <>
      <h1 className="text-24"> Home Page </h1>
      <button className="p-12 text-16 bg-gray-200 hover:opacity-80">
        <Link to="/login"> Go to Login </Link>
      </button>
    </>
  );
}
