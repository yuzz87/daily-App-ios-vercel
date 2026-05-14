import CoffeeDetailClient from "./CoffeeDetailClient";

export function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoffeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CoffeeDetailClient id={id} />;
}
