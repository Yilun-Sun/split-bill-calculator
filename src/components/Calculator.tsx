'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ExtraFee {
  id: string;
  name: string;
  amount: number;
  type: 'perPerson' | 'perOrder';
  expectedCount?: number;
}

interface BillData {
  items: Item[];
  extraFees: ExtraFee[];
}

interface ItemWithSelection extends Item {
  selectedCount: number;
}

export default function Calculator({ encodedData }: { encodedData: string }) {
  const [items, setItems] = useState<ItemWithSelection[]>([]);
  const [extraFees, setExtraFees] = useState<ExtraFee[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    try {
      const decodedData: BillData = JSON.parse(decodeURIComponent(encodedData));
      const itemsWithSelection = decodedData.items.map((item) => ({
        ...item,
        selectedCount: 0,
      }));
      setItems(itemsWithSelection);
      setExtraFees(decodedData.extraFees);
    } catch (error) {
      console.error('Failed to parse data:', error);
    }
  }, [encodedData]);

  const updateQuantity = (id: string, delta: number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newCount = Math.max(0, Math.min(item.quantity, item.selectedCount + delta));
          return { ...item, selectedCount: newCount };
        }
        return item;
      })
    );
  };

  useEffect(() => {
    const perOrderFeesTotal = extraFees
      .filter((fee) => fee.type === 'perOrder')
      .reduce((sum, fee) => sum + fee.amount, 0);

    const perPersonFeesTotal = extraFees
      .filter((fee) => fee.type === 'perPerson')
      .reduce((sum, fee) => {
        const expectedCount = fee.expectedCount || 1;
        return sum + fee.amount / expectedCount;
      }, 0);

    const totalSelectedItems = items.reduce((sum, item) => sum + item.selectedCount, 0);

    const extraFeesPerOrder = totalSelectedItems > 0 ? perOrderFeesTotal / totalSelectedItems : 0;

    const total =
      items.reduce((sum, item) => {
        const unitPrice = item.price / item.quantity;
        return sum + (unitPrice + extraFeesPerOrder) * item.selectedCount;
      }, 0) + perPersonFeesTotal;

    setTotal(total);
  }, [items, extraFees]);

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>选择你吃的食物</h2>
        <ul className='space-y-2'>
          {items.map((item) => (
            <li key={item.id} className='flex justify-between items-center border p-2 rounded'>
              <span>
                {item.name} - ¥{(item.price / item.quantity).toFixed(2)}/个 (库存: {item.quantity})
              </span>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className='bg-gray-200 p-1 rounded'
                  disabled={item.selectedCount <= 0}
                >
                  <MinusIcon className='h-5 w-5' />
                </button>
                <span>{item.selectedCount}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className='bg-gray-200 p-1 rounded'
                  disabled={item.selectedCount >= item.quantity}
                >
                  <PlusIcon className='h-5 w-5' />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>额外费用</h2>
        <ul className='space-y-2'>
          {extraFees.map((fee) => (
            <li key={fee.id} className='flex justify-between items-center border p-2 rounded'>
              <span>{fee.name}</span>
              <span>¥{fee.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className='text-xl font-bold text-center'>你需要支付: ¥{total.toFixed(2)}</div>
    </div>
  );
}
