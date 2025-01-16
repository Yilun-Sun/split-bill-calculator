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
  const [copyStatus, setCopyStatus] = useState<string>('复制总额');

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
          const newCount = Math.max(
            0,
            Math.min(item.quantity, item.selectedCount + delta),
          );
          return { ...item, selectedCount: newCount };
        }
        return item;
      }),
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

    const totalSelectedItems = items.reduce(
      (sum, item) => sum + item.selectedCount,
      0,
    );

    const extraFeesPerOrder =
      totalSelectedItems > 0 ? perOrderFeesTotal / totalSelectedItems : 0;

    const total =
      items.reduce((sum, item) => {
        const unitPrice = item.price / item.quantity;
        return sum + (unitPrice + extraFeesPerOrder) * item.selectedCount;
      }, 0) + perPersonFeesTotal;

    setTotal(total);
  }, [items, extraFees]);

  const copyTotalToClipboard = () => {
    navigator.clipboard.writeText(`${total.toFixed(2)}`);
    setCopyStatus('已复制');
    setTimeout(() => setCopyStatus('复制总额'), 2000);
  };

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">选择你吃的食物</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>
                {item.name} - ¥{(item.price / item.quantity).toFixed(2)}/个
                (库存: {item.quantity})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className={`bg-gray-200 p-1 rounded ${
                    item.selectedCount <= 0 ? 'cursor-not-allowed' : ''
                  }`}
                  disabled={item.selectedCount <= 0}
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <span>{item.selectedCount}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="bg-gray-200 p-1 rounded"
                  disabled={item.selectedCount >= item.quantity}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">额外费用</h2>
        <ul className="space-y-2">
          {extraFees.map((fee) => (
            <li
              key={fee.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>
                {fee.name}
                {fee.type === 'perPerson'
                  ? ` (人数: ${fee.expectedCount})`
                  : ''}
              </span>
              <span>¥{fee.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-xl font-bold text-center flex justify-center items-center">
        你需要支付: ¥{total.toFixed(2)}
        <button
          onClick={copyTotalToClipboard}
          className={`ml-4 ${
            copyStatus === '已复制'
              ? 'bg-green-500 hover:bg-green-700'
              : 'bg-blue-500 hover:bg-blue-700'
          } text-white font-bold py-2 px-4 rounded`}
        >
          {copyStatus}
        </button>
      </div>
    </div>
  );
}
