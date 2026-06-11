import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import {
  fetchWalletHistory,
  isInbound,
  WalletTransaction } from
'../lib/api';
import { t } from '../lib/i18n';

// Demo fallback so the canvas preview is never blank (used when the API call
// fails, e.g. opened without an auth token).
const fallback: { total: number; txns: WalletTransaction[] } = {
  total: 250000,
  txns: [
  { id: 1, type: 'out', amount: 35000, reason: 'Ad Plan Purchase (3 stars)', ad_request_id: 98234, transfer_company_id: 1, created_at: '2023-10-24 14:30' },
  { id: 2, type: 'in', amount: 100000, reason: 'Wallet Top-up', ad_request_id: null, transfer_company_id: 1, created_at: '2023-10-23 09:15' },
  { id: 3, type: 'out', amount: 10000, reason: 'Ad Plan Purchase (1 star)', ad_request_id: 98102, transfer_company_id: null, created_at: '2023-10-20 18:45' },
  { id: 4, type: 'out', amount: 5000, reason: 'Ad Renewal', ad_request_id: 97550, transfer_company_id: 2, created_at: '2023-10-15 11:20' },
  { id: 5, type: 'in', amount: 200000, reason: 'Wallet Top-up', ad_request_id: null, transfer_company_id: 2, created_at: '2023-10-01 10:00' }]

};

export function History() {
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchWalletHistory(page)
      .then((res) => {
        if (!active) return;
        setTotalBalance(res.total_balance);
        setTxns((prev) => (page === 1 ? res.transactions : [...prev, ...res.transactions]));
        setLastPage(res.last_page ?? page);
      })
      .catch(() => {
        if (!active) return;
        // Fall back to demo data on first page only.
        if (page === 1) {
          setTotalBalance(fallback.total);
          setTxns(fallback.txns);
          setLastPage(1);
          setUsedFallback(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);

  const hasMore = !usedFallback && page < lastPage;

  return (
    <Layout>
      {/* Fixed Header Area */}
      <div className="bg-slate-50 dark:bg-app-dark border-b border-slate-200 dark:border-slate-800 z-20 sticky top-0">
        <Header title={t('transactionHistory')} showBack />

        <div className="px-6 pb-6 pt-2 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {t('totalBalance')}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalBalance === null ?
            <span className="inline-block h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> :

            `${totalBalance.toLocaleString()} IQD`
            }
          </p>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {loading && txns.length === 0 ?
        <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div> :
        txns.length === 0 ?
        <div className="text-center py-20 text-slate-400 text-sm">
            {t('noTransactions')}
          </div> :

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {txns.map((tx, index) => {
            const inbound = isInbound(tx);
            return (
              <motion.div
                key={tx.id}
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: Math.min(index, 10) * 0.05
                }}
                className="p-4 flex items-center gap-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">

                {/* Type icon */}
                <div
                  className={`p-3 rounded-full shrink-0 ${inbound ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>

                  {inbound ?
                  <ArrowDownLeft className="w-5 h-5" /> :

                  <ArrowUpRight className="w-5 h-5" />
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* Reason */}
                  <p className="font-semibold text-slate-900 dark:text-white truncate text-[15px]">
                    {tx.reason ?? (inbound ? t('credit') : t('debit'))}
                  </p>
                  {/* Created At */}
                  {tx.created_at &&
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tx.created_at}
                    </p>
                  }
                  {/* ad_request_id / transfer_company_id (if available) */}
                  {(tx.ad_request_id || tx.transfer_company_id) &&
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {tx.ad_request_id &&
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {t('adLabel')} {tx.ad_request_id}
                        </span>
                    }
                      {tx.transfer_company_id &&
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {t('companyLabel')} {tx.transfer_company_id}
                        </span>
                    }
                    </div>
                  }
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p
                    className={`font-bold text-[15px] ${inbound ? 'text-green-600 dark:text-green-500' : 'text-slate-900 dark:text-white'}`}>

                    {inbound ? '+' : '-'}
                    {Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                    IQD
                  </p>
                </div>
              </motion.div>);

          })}
          </div>
        }

        {/* Load more */}
        {hasMore &&
        <div className="p-4">
            <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">

              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('loadMore')}
            </button>
          </div>
        }

        {/* Bottom padding for scroll */}
        <div className="h-12"></div>
      </div>
    </Layout>);

}
