import Link from 'next/link';
import { Package, Sparkles, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white py-24 px-4 text-center">
        <h1 className="text-5xl font-extrabold mb-4">What's Inside?</h1>
        <p className="text-xl text-purple-200 max-w-xl mx-auto mb-8">
          Every blind box holds a surprise. Rare collectibles, everyday gems — you won't know until you open it.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-white text-purple-700 font-bold px-8 py-3 rounded-full hover:bg-purple-50 transition-colors text-lg"
        >
          Explore Shop →
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl w-full mx-auto py-20 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Package, title: 'Mystery Items', desc: 'Each purchase reveals a randomly selected item from a curated pool.' },
          { icon: Sparkles, title: 'Rarity Tiers', desc: 'Common, Uncommon, Rare, and Legendary items with weighted probabilities.' },
          { icon: ShieldCheck, title: 'Fair & Transparent', desc: 'Probability weights are shown upfront. No hidden tricks.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl p-6 shadow-md text-center">
            <div className="flex justify-center mb-4">
              <Icon className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
