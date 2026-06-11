import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { HowItWorks } from '../components/HowItWorks';
import { useApi } from '../hooks/useApi';
import { fetchAdPackages, getAdRequestId, AdPackage } from '../lib/api';

// Demo fallback so the screen renders without a token / network.
const fallback: AdPackage[] = [
{ id: 1, label: 'THE', stars: 1, fees: 10000, features: ['One-time post', 'Showcase the span of 30 days across our application only.'], recommended: false, raw: {} },
{ id: 2, label: 'THE', stars: 2, fees: 15000, features: ['One-time post', 'Showcase the span of 1 month'], recommended: false, raw: {} },
{ id: 3, label: 'THE', stars: 3, fees: 35000, features: ['Post + 8 renewals', 'Showcase the span of 60 days.'], recommended: true, recommendNote: '(( We recommend it ))', raw: {} }];

export function SelectPlan() {
  const navigate = useNavigate();
  // GET /settings — the list of ad packages.
  const { data, loading } = useApi<AdPackage[]>(fetchAdPackages, [], fallback);
  const plans = data ?? [];

  const goToPayment = (planId: number) => {
    navigate(`/payment?ad_request_id=${getAdRequestId()}&plan=${planId}`);
  };

  return (
    <Layout>
      <Header title="Select Ad Plan" showBack />

      {loading ?
      <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div> :

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
          {plans.map((plan, index) =>
        <motion.div
          key={plan.id}
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: index * 0.1
          }}
          className="relative pt-3">

            {/* Border Label */}
            <div className="absolute top-0 left-6 bg-slate-50 dark:bg-app-dark px-2 flex items-center gap-1 z-10 text-sm font-bold text-slate-900 dark:text-white">
              {plan.label}
              <div className="flex">
                {[...Array(plan.stars)].map((_, i) =>
              <Star
                key={i}
                className="w-4 h-4 fill-[#F5B301] text-[#F5B301]" />

              )}
              </div>
            </div>

            {/* Card Content */}
            <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 pt-6 relative">
              <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">+ -</span>
                  <span>Price: {plan.fees.toLocaleString()} IQD.</span>
                </li>
                {plan.features.map((feature, i) =>
              <li key={i} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">-</span>
                    <span>{feature}</span>
                  </li>
              )}
                {plan.recommended &&
              <li className="flex items-start gap-2 mt-4">
                    <span className="text-slate-400 mt-0.5"></span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ((( {plan.recommendNote ?? 'We recommend it'} )))
                    </span>
                  </li>
              }
              </ul>

              <button
              onClick={() => goToPayment(plan.id)}
              className="w-full bg-app-accent hover:bg-app-accentHover text-white font-medium py-3.5 rounded-xl transition-colors active:scale-[0.98]">

                Pay
              </button>
            </div>
          </motion.div>
        )}
        </div>
      }

      <HowItWorks />
    </Layout>);

}
