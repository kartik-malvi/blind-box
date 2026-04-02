'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, CheckCircle, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blind-box-beta.vercel.app';

export default function CreateBoxPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '' });
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const embedCode = created
    ? `<iframe src="${APP_URL}/widget?boxId=${created.id}" style="width:100%;height:700px;border:none;border-radius:16px;" allow="payment" loading="lazy" title="${created.name}"></iframe>`
    : '';

  const createBox = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/blind-boxes', { ...payload, price: parseFloat(payload.price) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] });
      setCreated({ id: res.data.id, name: res.data.name });
      setForm({ name: '', description: '', price: '', imageUrl: '' });
    },
  });

  const copy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-xl">
      {/* Back link */}
      <Link href="/manage" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> All Boxes
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-6">Create Blind Box</h1>

      {/* Success state */}
      {created && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-800">"{created.name}" created!</p>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Copy this embed code and paste it into a <strong>Custom HTML block</strong> on your store to show this blind box:
          </p>
          <textarea
            readOnly value={embedCode} rows={3}
            className="w-full text-xs font-mono bg-white border border-gray-200 rounded-xl p-3 resize-none text-gray-700 focus:outline-none"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-sm bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Embed Code'}
            </button>
            <Link
              href="/manage"
              className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              View All Boxes
            </Link>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Box Name *</label>
            <input
              className="input-base" placeholder="e.g. Mystery Toy Series 1"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Price (USD) *</label>
            <input
              className="input-base" placeholder="e.g. 9.99" type="number"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <input
              className="input-base" placeholder="What's inside this box?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Image URL</label>
            <input
              className="input-base" placeholder="https://..."
              value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={() => createBox.mutate(form)}
          disabled={!form.name || !form.price || createBox.isPending}
          className="mt-5 flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {createBox.isPending ? 'Creating...' : 'Create Box'}
        </button>
      </div>

      <style jsx global>{`
        .input-base {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
          background: white;
        }
        .input-base:focus { border-color: #a78bfa; }
      `}</style>
    </div>
  );
}
