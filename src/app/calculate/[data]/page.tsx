import Calculator from '@/components/Calculator';

export default function CalculatePage({ params }: { params: { data: string } }) {
  return (
    <main className='min-h-screen p-4 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold text-center mb-8'>计算分账</h1>
      <Calculator encodedData={params.data} />
    </main>
  );
}
