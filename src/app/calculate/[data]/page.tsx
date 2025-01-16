import Calculator from '@/components/Calculator';

type Params = Promise<{ data: string }>;

export default async function CalculatePage({ params }: { params: Params }) {
  const { data } = await params;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto bg-white text-black">
      <h1 className="text-2xl font-bold text-center mb-8">计算分账</h1>
      <Calculator encodedData={data} />
    </main>
  );
}
