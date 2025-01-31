'use client';

import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

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
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    quantity: '1',
  });
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
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingFee, setEditingFee] = useState<ExtraFee | null>(null);
  const [uploadingText, setUploadingText] = useState('正在识别...');

  const uploadingTexts = [
    '正在清点吮指鸡...',
    '正在数蛋挞个数...',
    '正在计算优惠...',
    '正在偷吃薯条...',
    '正在舔勺土豆泥...',
    '正在咬一口汉堡...',
    '正在喝可乐解渴...',
    '正在研究配料表...',
    '正在找优惠券...',
    '正在偷看配方...',
  ];

  // 计算订单总价
  const totalPrice = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    const feesTotal = extraFees.reduce((sum, fee) => sum + fee.amount, 0);
    return itemsTotal + feesTotal;
  }, [items, extraFees]);

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
          expectedCount:
            newFee.type === 'perPerson'
              ? Number(newFee.expectedCount)
              : undefined,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // 设置随机的上传文案
    const updateUploadingText = () => {
      const randomText =
        uploadingTexts[Math.floor(Math.random() * uploadingTexts.length)];
      setUploadingText(randomText);
    };

    // 每 2 秒更新一次文案
    const textInterval = setInterval(updateUploadingText, 2000);
    updateUploadingText(); // 立即设置第一个随机文案

    try {
      // 清空现有数据
      setItems([]);
      setExtraFees([]);

      // 处理每个文件
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });

        const billData = await response.json();

        if (billData.error) {
          throw new Error(billData.error);
        }

        // 添加识别出的商品
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        billData.items?.forEach((item: any) => {
          setItems((prev) => [
            ...prev,
            {
              id: uuidv4(),
              name: item.name,
              price: Number(item.price),
              quantity: Number(item.quantity) || 1,
            },
          ]);
        });

        // 添加识别出的额外费用
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        billData.extraFees?.forEach((fee: any) => {
          setExtraFees((prev) => [
            ...prev,
            {
              id: uuidv4(),
              name: fee.name,
              amount: Number(fee.amount),
              type: fee.type || 'perOrder',
            },
          ]);
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      clearInterval(textInterval);
      setIsUploading(false);
      setUploadingText('正在识别...'); // 重置文案
    }
  };

  // 修改商品处理函数
  const handleEditItem = (item: Item) => {
    setEditingItem({
      ...item,
    });
  };

  // 保存商品编辑
  const saveItemEdit = () => {
    if (editingItem) {
      setItems(
        items.map((item) => (item.id === editingItem.id ? editingItem : item)),
      );
      setEditingItem(null);
    }
  };

  // 修改费用处理函数
  const handleEditFee = (fee: ExtraFee) => {
    setEditingFee({
      ...fee,
    });
  };

  // 保存费用编辑
  const saveExtraFeeEdit = () => {
    if (editingFee) {
      setExtraFees((fees) =>
        fees.map((fee) => (fee.id === editingFee.id ? editingFee : fee)),
      );
      setEditingFee(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">添加食品</h2>
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">
              总价: ¥{totalPrice.toFixed(2)}
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleImageUpload}
                className="hidden"
                id="billImage"
                disabled={isUploading}
                multiple
              />
              <label
                htmlFor="billImage"
                className={`cursor-pointer bg-blue-500 text-white px-4 py-2 rounded ${
                  isUploading ? 'opacity-50' : ''
                }`}
              >
                {isUploading ? uploadingText : '上传账单截图'}
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="食品名称"
            className="border p-2 rounded flex-1"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="数量"
            className="border p-2 rounded w-20"
            value={newItem.quantity}
            min="1"
            onChange={(e) =>
              setNewItem({ ...newItem, quantity: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="总价"
            className="border p-2 rounded w-24"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          {(newItem.name || newItem.price || newItem.quantity !== '1') && (
            <button
              onClick={addItem}
              className="bg-blue-500 text-white p-2 rounded"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              {editingItem?.id === item.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="border p-2 rounded flex-1"
                  />
                  <input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="border p-2 rounded w-20"
                    min="1"
                  />
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: Number(e.target.value),
                      })
                    }
                    className="border p-2 rounded w-24"
                  />
                  <button
                    onClick={saveItemEdit}
                    className="bg-green-500 text-white p-2 rounded"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <>
                  <span>
                    {item.name} x{item.quantity} - 总价¥{item.price} (单价¥
                    {(item.price / item.quantity).toFixed(2)}/个)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-blue-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">添加额外费用</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="费用名称"
            className="border p-2 rounded flex-1"
            value={newFee.name}
            onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="金额"
            className="border p-2 rounded w-24"
            value={newFee.amount}
            onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
          />
          <select
            className="border p-2 rounded"
            value={newFee.type}
            onChange={(e) =>
              setNewFee({
                ...newFee,
                type: e.target.value as 'perPerson' | 'perOrder',
              })
            }
          >
            <option value="perOrder">按份数分摊</option>
            <option value="perPerson">按人数分摊</option>
          </select>
          {newFee.type === 'perPerson' && (
            <input
              type="number"
              placeholder="预计人数"
              className="border p-2 rounded w-24"
              value={newFee.expectedCount}
              min="1"
              onChange={(e) =>
                setNewFee({ ...newFee, expectedCount: e.target.value })
              }
            />
          )}
          {(newFee.name ||
            newFee.amount ||
            (newFee.type === 'perPerson' && newFee.expectedCount !== '1')) && (
            <button
              onClick={addExtraFee}
              className="bg-blue-500 text-white p-2 rounded"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {extraFees.map((fee) => (
            <li
              key={fee.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              {editingFee?.id === fee.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingFee.name}
                    onChange={(e) =>
                      setEditingFee({ ...editingFee, name: e.target.value })
                    }
                    className="border p-2 rounded flex-1"
                  />
                  <input
                    type="number"
                    value={editingFee.amount}
                    onChange={(e) =>
                      setEditingFee({
                        ...editingFee,
                        amount: Number(e.target.value),
                      })
                    }
                    className="border p-2 rounded w-24"
                  />
                  <select
                    value={editingFee.type}
                    onChange={(e) =>
                      setEditingFee({
                        ...editingFee,
                        type: e.target.value as 'perPerson' | 'perOrder',
                      })
                    }
                    className="border p-2 rounded"
                  >
                    <option value="perOrder">按份数分摊</option>
                    <option value="perPerson">按人数分摊</option>
                  </select>
                  {editingFee.type === 'perPerson' && (
                    <input
                      type="number"
                      value={editingFee.expectedCount || 1}
                      onChange={(e) =>
                        setEditingFee({
                          ...editingFee,
                          expectedCount: Number(e.target.value),
                        })
                      }
                      className="border p-2 rounded w-20"
                      min="1"
                    />
                  )}
                  <button
                    onClick={saveExtraFeeEdit}
                    className="bg-green-500 text-white p-2 rounded"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <>
                  <span>
                    {fee.name} - ¥{fee.amount}
                    {fee.type === 'perPerson' &&
                      ` (按人数分摊，预计${fee.expectedCount}人)`}
                    {fee.type === 'perOrder' && ' (按份数分摊)'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditFee(fee)}
                      className="text-blue-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => removeExtraFee(fee.id)}
                      className="text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={generateShareLink}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold"
      >
        生成分享链接
      </button>
    </div>
  );
}
