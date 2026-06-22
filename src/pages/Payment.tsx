import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2 } from
'lucide-react';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../hooks/useApi';
import {
  fetchQuote,
  fetchWalletBalance,
  fetchTransferCompanies,
  fetchAdPackages,
  payWithWallet,
  submitTopUp,
  getAdRequestId,
  getSelectedPlanId,
  Quote,
  WalletBalance,
  TransferCompany,
  AdPackage } from
'../lib/api';
import { t } from '../lib/i18n';

type PaymentMethod = 'wallet' | 'direct' | 'topup';

const fmt = (n: number) => n.toLocaleString();

export function Payment() {
  const navigate = useNavigate();
  const { dir } = useTheme();
  const adRequestId = getAdRequestId();

  const planId = getSelectedPlanId();
  const packages = useApi<AdPackage[]>(fetchAdPackages, [], []);
  const selectedPlan = packages.data?.find((p) => String(p.id) === planId);

  const quote = useApi<Quote>(() => fetchQuote(adRequestId), [adRequestId], {
    amount: 50000,
    currency: 'IQD'
  });
  const wallet = useApi<WalletBalance>(fetchWalletBalance, [], {
    balance: 250000,
    currency: 'IQD'
  });
  const companies = useApi<TransferCompany[]>(fetchTransferCompanies, [], [
  { id: 1, name: 'ZainCash' },
  { id: 2, name: 'AsiaHawala' },
  { id: 3, name: 'FastPay' }]
  );

  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const quoteAmount = quote.data?.amount ?? 0;
  // "For Pay" = fees of the plan chosen on the Select Plan screen (/settings).
  // Falls back to the quote endpoint when no plan was passed in the URL.
  const forPayAmount = selectedPlan ? selectedPlan.fees : quoteAmount;
  const forPayCurrency = selectedPlan ? 'IQD' : quote.data?.currency ?? 'IQD';
  const forPayLoading = planId ? packages.loading : quote.loading;
  const balance = wallet.data?.balance ?? 0;
  const companyList = companies.data ?? [];
  const activeCompany = companyList.find((c) => String(c.id) === selectedCompany);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(t('numberCopied'));
  };

  const handleWalletPay = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await payWithWallet(adRequestId);
      toast.success(res?.message ?? t('paymentSuccess'), {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
      wallet.reload();
    } catch (err: any) {
      toast.error(err?.message ?? t('insufficientBalance'), {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectPay = () => {
    const company = companyList.find((c) => String(c.id) === selectedCompany);
    if (!company) return;
    if (company.app_link) window.open(company.app_link, '_blank');
    setIsSubmitted(true);
    toast.success(t('paymentUnderReview'));
  };

  const handleTopUp = async () => {
    if (submitting) return;
    const amount = Number(topUpAmount);
    const company = companyList.find((c) => String(c.id) === selectedCompany);
    if (!amount || amount < 1000) {
      toast.error(t('minTopUpAmount'));
      return;
    }
    if (!company) {
      toast.error(t('selectCompanyError'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitTopUp({
        amount,
        transferCompanyId: company.id
      });
      // Show the result first, then open the transfer company link — only
      // when the request actually succeeded.
      setIsSubmitted(true);
      toast.success(res?.message ?? t('paymentUnderReview'));
      const link = company.app_link ?? res?.redirect_url;
      if (link) window.open(link, '_blank');
    } catch (err: any) {
      toast.error(err?.message ?? t('topUpFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Header title={t('payment')} showBack />

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        <div className="space-y-4">
          <button
            onClick={() => navigate('/history')}
            className="w-full bg-white dark:bg-app-card rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80">

            <div className="text-start">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                {t('walletBalance')}
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {wallet.loading ?
                <span className="inline-block h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> :

                `${fmt(balance)} ${wallet.data?.currency ?? 'IQD'}`
                }
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {dir === 'rtl' ?
              <ChevronLeft className="w-5 h-5" /> :

              <ChevronRight className="w-5 h-5" />
              }
            </div>
          </button>

          <div className="w-full bg-white dark:bg-app-card rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              {t('forPay')}
            </p>
            <p className="text-xl font-bold text-app-accent">
              {forPayLoading ?
              <span className="inline-block h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> :

              `${fmt(forPayAmount)} ${forPayCurrency}`
              }
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white px-1">
            {t('paymentMethod')}
          </h2>

          <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
            {(['wallet', 'direct', 'topup'] as const).map((m) =>
            <button
              key={m}
              onClick={() => {
                setMethod(m);
                setIsSubmitted(false);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${method === m ? 'bg-white dark:bg-app-card text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>

                {m === 'wallet' ?
              t('wallet') :
              m === 'direct' ?
              t('direct') :
              t('topUp')}
              </button>
            )}
          </div>

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {method === 'wallet' &&
              <motion.div
                key="wallet"
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -10
                }}
                className="space-y-6">

                  <div className="bg-white dark:bg-app-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 text-center">
                      {t('payFromWalletDesc')}
                    </p>

                    <button
                    onClick={handleWalletPay}
                    disabled={submitting}
                    className="w-full bg-app-accent hover:bg-app-accentHover disabled:opacity-60 text-white font-medium py-3.5 rounded-xl transition-colors active:scale-[0.98] flex items-center justify-center gap-2">

                      {submitting &&
                    <Loader2 className="w-4 h-4 animate-spin" />}
                      {t('payNow')}
                    </button>
                  </div>
                </motion.div>
              }

              {(method === 'direct' || method === 'topup') &&
              <motion.div
                key={method}
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -10
                }}
                className="space-y-4">

                  {method === 'topup' &&
                <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 px-1">
                        {t('amountToTopUp')}
                      </label>
                      <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder={t('amountPlaceholder')}
                    className="w-full bg-white dark:bg-app-card border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-app-accent/50" />

                    </div>
                }

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 px-1">
                      {t('selectTransferCompany')}
                    </label>
                    <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full bg-white dark:bg-app-card border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-app-accent/50 appearance-none">

                      <option value="" disabled>
                        {t('chooseCompany')}
                      </option>
                      {companyList.map((c) =>
                    <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                    )}
                    </select>
                  </div>

                  <AnimatePresence>
                    {activeCompany?.account_number &&
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto'
                    }}
                    exit={{
                      opacity: 0,
                      height: 0
                    }}
                    className="space-y-2 overflow-hidden">

                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 px-1">
                          {t('transferNumber')}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white font-mono text-lg tracking-wider">
                            {activeCompany.account_number}
                          </div>
                          <button
                        onClick={() => handleCopy(activeCompany.account_number!)}
                        className="p-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors">

                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>

                  <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                    {method === 'direct' ? t('directHint') : t('topUpHint')}
                  </p>

                  <button
                  onClick={method === 'direct' ? handleDirectPay : handleTopUp}
                  disabled={!selectedCompany || submitting || (method === 'topup' && !topUpAmount)}
                  className="w-full mt-2 bg-app-accent hover:bg-app-accentHover disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3.5 rounded-xl transition-colors active:scale-[0.98] flex items-center justify-center gap-2">

                    {submitting &&
                  <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('pay')}
                  </button>

                  <AnimatePresence>
                    {isSubmitted &&
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-start gap-3">

                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-400">
                            {t('paymentUnderReview')}
                          </h4>
                          <p className="text-xs text-green-600 dark:text-green-500/80 mt-1">
                            {t('underReviewDetail')}
                          </p>
                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>);

}
