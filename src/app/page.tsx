import CreateBill from '@/components/create-bill.component';

export default function Home() {
  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-8">分账计算器</h1>
      <CreateBill />
    </main>
  );
}
