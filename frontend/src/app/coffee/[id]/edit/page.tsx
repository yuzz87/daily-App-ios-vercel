import EditCoffeeForm from "./EditCoffeeForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCoffeePage({ params }: PageProps) {
  const { id } = await params;

  return <EditCoffeeForm coffeeBeanId={id} />;
}
