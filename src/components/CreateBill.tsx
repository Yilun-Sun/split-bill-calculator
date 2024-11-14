'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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

export default function CreateBill() {
  const [items, setItems] = useState<Item[]>([]);
  const [extraFees, setExtraFees] = useState<ExtraFee[]>([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '1' });
  const [newFee, setNewFee] = useState<{
    name: string;
    amount: string;
    type: 'perPerson' | 'perOrder';
    expectedCount: string;
  }>({
    name: '',
    amount: '',
    type: 'perOrder',
    expectedCount: '1',
  });

  const addItem = () => {
    if (newItem.name && newItem.price) {
      setItems([
        ...items,
        {
          id: uuidv4(),
          name: newItem.name,
          price: Number(newItem.price),
          quantity: Number(newItem.quantity) || 1,
        },
      ]);
      setNewItem({ name: '', price: '', quantity: '1' });
    }
  };

  const addExtraFee = () => {
    if (newFee.name && newFee.amount) {
      setExtraFees([
        ...extraFees,
        {
          id: uuidv4(),
          name: newFee.name,
          amount: Number(newFee.amount),
          type: newFee.type,
          expectedCount: newFee.type === 'perPerson' ? Number(newFee.expectedCount) : undefined,
        },
      ]);
      setNewFee({ name: '', amount: '', type: 'perOrder', expectedCount: '1' });
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const removeExtraFee = (id: string) => {
    setExtraFees(extraFees.filter((fee) => fee.id !== id));
  };

  const generateShareLink = () => {
    const data = {
      items,
      extraFees,
    };
    const encodedData = encodeURIComponent(JSON.stringify(data));
    const url = `${window.location.origin}/calculate/${encodedData}`;

    // 复制链接到剪贴板
    navigator.clipboard.writeText(url);
    alert('分享链接已复制到剪贴板！');
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>添加食品</h2>
        <div className='flex gap-2'>
          <input
            type='text'
            placeholder='食品名称'
            className='border p-2 rounded flex-1'
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <input
            type='number'
            placeholder='数量'
            className='border p-2 rounded w-20'
            value={newItem.quantity}
            min='1'
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
          />
          <input
            type='number'
            placeholder='总价'
            className='border p-2 rounded w-24'
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <button onClick={addItem} className='bg-blue-500 text-white p-2 rounded'>
            <PlusIcon className='h-5 w-5' />
          </button>
        </div>

        <ul className='space-y-2'>
          {items.map((item) => (
            <li key={item.id} className='flex justify-between items-center border p-2 rounded'>
              <span>
                {item.name} x{item.quantity} - 总价¥{item.price} (单价¥{(item.price / item.quantity).toFixed(2)}/个)
              </span>
              <button onClick={() => removeItem(item.id)} className='text-red-500'>
                <TrashIcon className='h-5 w-5' />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>添加额外费用</h2>
        <div className='flex gap-2'>
          <input
            type='text'
            placeholder='费用名称'
            className='border p-2 rounded flex-1'
            value={newFee.name}
            onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
          />
          <input
            type='number'
            placeholder='金额'
            className='border p-2 rounded w-24'
            value={newFee.amount}
            onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
          />
          <select
            className='border p-2 rounded'
            value={newFee.type}
            onChange={(e) =>
              setNewFee({
                ...newFee,
                type: e.target.value as 'perPerson' | 'perOrder',
              })
            }
          >
            <option value='perOrder'>按份数分摊</option>
            <option value='perPerson'>按人数分摊</option>
          </select>
          {newFee.type === 'perPerson' && (
            <input
              type='number'
              placeholder='预计人数'
              className='border p-2 rounded w-24'
              value={newFee.expectedCount}
              min='1'
              onChange={(e) => setNewFee({ ...newFee, expectedCount: e.target.value })}
            />
          )}
          <button onClick={addExtraFee} className='bg-blue-500 text-white p-2 rounded'>
            <PlusIcon className='h-5 w-5' />
          </button>
        </div>

        <ul className='space-y-2'>
          {extraFees.map((fee) => (
            <li key={fee.id} className='flex justify-between items-center border p-2 rounded'>
              <span>
                {fee.name} - ¥{fee.amount}
                {fee.type === 'perPerson' && ` (按人数分摊，预计${fee.expectedCount}人)`}
                {fee.type === 'perOrder' && ' (按份数分摊)'}
              </span>
              <button onClick={() => removeExtraFee(fee.id)} className='text-red-500'>
                <TrashIcon className='h-5 w-5' />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={generateShareLink} className='w-full bg-green-500 text-white p-3 rounded font-semibold'>
        生成分享链接
      </button>
    </div>
  );
}
