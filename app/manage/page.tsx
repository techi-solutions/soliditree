import Container from "./container";

export default function Page() {
  return (
    <div className="min-h-screen container mx-auto p-4 space-y-6 text-black max-w-3xl relative pb-20 text-white">
      <meta name="theme-color" content="#0f766e" />
      <Container />
    </div>
  );
}
