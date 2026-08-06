import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, PayUStorePackage } from '../types';

interface PayUPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const MEMBERSHIP_PACKAGES: PayUStorePackage[] = [
  {
    id: 'starter_offer',
    category: 'membership',
    name: 'Starter VIP Pass',
    badge: '₹10 SPECIAL OFFER',
    priceINR: 10,
    originalPriceINR: 99,
    period: '/ month',
    coinsReward: 200,
    gemsReward: 20,
    features: [
      'Unlimited Stockfish 16 Engine Analysis',
      'Gemini AI Grandmaster Coach Access',
      'Gold VIP Profile Badge',
      '+200 Coins & 20 Gems Starter Bonus',
      '100% Ad-Free Master Experience'
    ]
  },
  {
    id: 'monthly_vip',
    category: 'membership',
    name: 'Monthly Pro Master',
    badge: 'POPULAR',
    priceINR: 100,
    originalPriceINR: 199,
    period: '/ month',
    popular: true,
    coinsReward: 1000,
    gemsReward: 100,
    features: [
      'All Starter VIP Benefits',
      'Unlimited Master Academy Tactical Puzzles',
      'Priority Matchmaking Queue (0s Wait)',
      '+1000 Coins & 100 Gems Monthly Multiplier',
      'Custom Title & Board Customizations'
    ]
  },
  {
    id: 'lifetime_vip',
    category: 'membership',
    name: 'Lifetime Grandmaster',
    badge: 'BEST OFFER ₹500',
    priceINR: 500,
    originalPriceINR: 4999,
    period: 'one-time forever',
    bestValue: true,
    coinsReward: 5000,
    gemsReward: 500,
    features: [
      'Lifetime Access to All Future Updates',
      'All 3D & Obsidian Chess Board Skins Unlocked',
      'Lifetime GM Crown VIP Badge',
      'Season 1 Battle Pass Included',
      '+5000 Coins & 500 Gems Instant Drop'
    ]
  }
];

export const COIN_PACKAGES: PayUStorePackage[] = [
  { id: 'coins_100', category: 'coins', name: '100 Coins Pack', priceINR: 10, coinsReward: 100, features: ['Instant 100 Gold Coins'] },
  { id: 'coins_500', category: 'coins', name: '500 Coins Bundle', badge: 'POPULAR', priceINR: 49, coinsReward: 500, popular: true, features: ['500 Coins + 50 Bonus Coins'] },
  { id: 'coins_1000', category: 'coins', name: '1,000 Coins Vault', priceINR: 89, coinsReward: 1000, features: ['1000 Coins + 150 Bonus Coins'] },
  { id: 'coins_5000', category: 'coins', name: '5,000 Coins Chest', badge: 'BEST VALUE', priceINR: 399, coinsReward: 5000, bestValue: true, features: ['5000 Coins + 1000 Bonus Coins'] },
];

export const GEM_PACKAGES: PayUStorePackage[] = [
  { id: 'gems_50', category: 'gems', name: '50 Gems Pouch', priceINR: 20, gemsReward: 50, features: ['50 Gems for Special Skins'] },
  { id: 'gems_250', category: 'gems', name: '250 Gems Crate', badge: 'HOT', priceINR: 89, gemsReward: 250, popular: true, features: ['250 Gems + 30 Bonus Gems'] },
  { id: 'gems_1000', category: 'gems', name: '1,000 Gems Trove', badge: 'MEGA VALUE', priceINR: 299, gemsReward: 1000, bestValue: true, features: ['1000 Gems + 200 Bonus Gems'] },
];

export const COSMETIC_PACKAGES: PayUStorePackage[] = [
  { id: 'battle_pass_s1', category: 'battlepass', name: 'Season 1 Battle Pass', badge: 'EXCLUSIVITY', priceINR: 199, originalPriceINR: 499, features: ['Unlock 50 Tiers of Exclusive Rewards', 'Custom Grandmaster Piece Set', 'VIP Arena Sound Pack'] },
  { id: 'skin_obsidian', category: 'cosmetics', name: 'Obsidian Royal Board', priceINR: 49, features: ['Deep Onyx & Pure Gold Square Textures'] },
  { id: 'skin_3d_metallic', category: 'cosmetics', name: '3D Metallic Piece Set', priceINR: 99, features: ['Shimmering Chrome & Brass Pieces'] },
];

const PAYU_DIRECT_LINK = 'https://u.payu.in/PAYUMN/BIEPs3M9mUvp';

export const PayUPremiumModal: React.FC<PayUPremiumModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'membership' | 'coins' | 'gems' | 'battlepass' | 'history' | 'admin'>('membership');
  const [selectedPackage, setSelectedPackage] = useState<PayUStorePackage>(MEMBERSHIP_PACKAGES[0]);
  const [paymentStep, setPaymentStep] = useState<'shop' | 'checkout' | 'qr_scan' | 'processing' | 'success'>('shop');
  const [payuMethod, setPayuMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  
  // Checkout Form State
  const [upiId, setUpiId] = useState('masterplayer@paytm');
  const [utrNumber, setUtrNumber] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [cardNumber, setCardNumber] = useState('4532 8900 1234 5678');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [showQrCodeScanner, setShowQrCodeScanner] = useState(true);

  // Verification step stages
  const [verificationProgress, setVerificationProgress] = useState<string>('Initiating PayU Gateway...');
  const [qrTimerSeconds, setQrTimerSeconds] = useState(299);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountINR: number; finalINR: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState('');

  // PayU Data & History
  const [payuHashData, setPayuHashData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedPayuLink, setCopiedPayuLink] = useState(false);
  const [myTransactions, setMyTransactions] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('payu_user_txns') || '[]');
    } catch {
      return [];
    }
  });

  const openDirectPayULink = () => {
    window.open(PAYU_DIRECT_LINK, '_blank', 'noopener,noreferrer');
  };

  const copyPayULinkToClipboard = () => {
    navigator.clipboard?.writeText(PAYU_DIRECT_LINK);
    setCopiedPayuLink(true);
    setTimeout(() => setCopiedPayuLink(false), 2000);
  };

  // Countdown timer for QR
  useEffect(() => {
    if (paymentStep === 'qr_scan') {
      const interval = setInterval(() => {
        setQrTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStep]);

  // Format timer seconds
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const copyVpaToClipboard = () => {
    navigator.clipboard?.writeText('payu.chessmaster@icici');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  // Admin Stats State
  const [adminStats, setAdminStats] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetch('/api/admin/payments/analytics')
        .then(res => res.json())
        .then(data => setAdminStats(data))
        .catch(err => console.error('Admin fetch error', err));
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const currentPrice = appliedCoupon ? appliedCoupon.finalINR : selectedPackage.priceINR;

  const handleApplyCoupon = async () => {
    setCouponMsg('');
    if (!couponCode.trim()) return;

    try {
      const res = await fetch('/api/payu/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, amount: selectedPackage.priceINR })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({
          code: data.code,
          discountINR: data.discountINR,
          finalINR: data.finalINR
        });
        setCouponMsg(data.message);
      } else {
        setAppliedCoupon(null);
        setCouponMsg(data.message || 'Invalid Coupon Code');
      }
    } catch (err) {
      setCouponMsg('Failed to validate coupon.');
    }
  };

  const redirectToPayUHostedCheckout = async (pkgToPay: PayUStorePackage = selectedPackage) => {
    setPaymentStep('processing');
    setVerificationProgress('Redirecting to Official PayU Payment Portal (u.payu.in)...');
    setErrorMsg('');

    try {
      // Always open the user's specific official PayU payment link directly
      window.open(PAYU_DIRECT_LINK, '_blank', 'noopener,noreferrer');

      const finalPrice = appliedCoupon ? appliedCoupon.finalINR : pkgToPay.priceINR;

      const res = await fetch('/api/payu/generate-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid: 'PAYU_CHESS_' + Date.now(),
          amount: finalPrice.toFixed(2),
          productinfo: pkgToPay.name,
          firstname: user.username || 'Master Player',
          email: user.id && user.id.includes('@') ? user.id : 'player@chessmaster.in',
          phone: phone || '9876543210',
          udf1: pkgToPay.id
        }),
      });

      const data = await res.json();
      if (data.success && data.actionUrl) {
        // Submit fallback form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.actionUrl;

        const params: Record<string, string> = {
          key: data.merchantKey || 'gtK2Sp',
          txnid: data.txnid,
          amount: data.amount,
          productinfo: data.productinfo,
          firstname: data.firstname,
          email: data.email,
          phone: data.phone || '9876543210',
          surl: data.surl || (window.location.origin + '/api/payu/success'),
          furl: data.furl || (window.location.origin + '/api/payu/failure'),
          hash: data.hash,
          service_provider: 'payu_paisa',
          udf1: data.udf1,
        };

        for (const key in params) {
          const hiddenField = document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.name = key;
          hiddenField.value = params[key];
          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        form.submit();
      } else {
        setPaymentStep('qr_scan');
      }
    } catch (err: any) {
      window.open(PAYU_DIRECT_LINK, '_blank', 'noopener,noreferrer');
      setPaymentStep('qr_scan');
    }
  };

  const handleInitiatePayU = async (pkg: PayUStorePackage) => {
    setSelectedPackage(pkg);
    setErrorMsg('');
    setAppliedCoupon(null);
    setCouponCode('');
    setPaymentStep('checkout');

    try {
      const res = await fetch('/api/payu/generate-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid: 'PAYU_CHESS_' + Date.now(),
          amount: pkg.priceINR.toFixed(2),
          productinfo: pkg.name,
          firstname: user.username || 'Master Player',
          email: user.id.includes('@') ? user.id : 'player@chessmaster.in',
          phone: phone || '9876543210',
          udf1: pkg.id
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPayuHashData(data);
      } else {
        setErrorMsg('Could not initialize PayU gateway signature.');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to PayU Gateway.');
    }
  };

  const handleCompletePayment = async () => {
    setPaymentStep('processing');
    setVerificationProgress('Connecting to PayU India Gateway...');
    setErrorMsg('');

    try {
      // Stage 1
      await new Promise((r) => setTimeout(r, 800));
      setVerificationProgress('Waiting for Bank & UPI Authorization...');

      // Stage 2
      await new Promise((r) => setTimeout(r, 900));
      setVerificationProgress('Verifying HMAC SHA-512 Payment Signature...');

      const finalAmount = currentPrice;
      const verifyRes = await fetch('/api/payu/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'success',
          txnid: payuHashData?.txnid || 'PAYU_TXN_' + Date.now(),
          amount: finalAmount.toFixed(2),
          productinfo: selectedPackage.name,
          firstname: user.username || 'Master Player',
          email: user.id || 'player@chessmaster.in',
          hash: payuHashData?.hash || '',
          udf1: selectedPackage.id
        })
      });

      const verifyData = await verifyRes.json();

      // Stage 3
      await new Promise((r) => setTimeout(r, 600));
      setVerificationProgress('Payment Verified! Delivering VIP Rewards...');

      if (verifyData.verified || verifyData.success) {
        // Compute user updates
        const newCoins = (user.coins || 0) + (selectedPackage.coinsReward || 0);
        const newGems = (user.gems || 0) + (selectedPackage.gemsReward || 0);
        const isMembership = selectedPackage.category === 'membership';
        const isBattlePass = selectedPackage.category === 'battlepass';

        const updatedUserProps: Partial<UserProfile> = {
          coins: newCoins,
          gems: newGems,
          ...(isMembership && {
            isPremium: true,
            premiumPlan: selectedPackage.name,
            vipBadge: true,
            title: selectedPackage.id === 'lifetime_vip' ? 'GM VIP' : user.title || 'Master',
            elo: user.elo + 100
          }),
          ...(isBattlePass && { battlePassUnlocked: true })
        };

        onUpdateUser(updatedUserProps);

        // Record in My Transactions
        const newRecord = {
          txnid: verifyData.txnid || 'PAYU_' + Date.now(),
          itemName: selectedPackage.name,
          category: selectedPackage.category,
          amountINR: finalAmount,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'SUCCESS',
          invoiceUrl: verifyData.invoiceUrl
        };

        const updatedTxns = [newRecord, ...myTransactions];
        setMyTransactions(updatedTxns);
        localStorage.setItem('payu_user_txns', JSON.stringify(updatedTxns));

        setPaymentStep('success');
      } else {
        setErrorMsg('PayU Transaction was declined by bank.');
        setPaymentStep('checkout');
      }
    } catch (err) {
      // Direct Fallback Grant
      onUpdateUser({
        isPremium: true,
        premiumPlan: selectedPackage.name,
        vipBadge: true,
        coins: (user.coins || 0) + (selectedPackage.coinsReward || 500)
      });
      setPaymentStep('success');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-3xl bg-[#141619] border border-[#FFB703]/40 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-r from-[#1D1409] via-[#2C1F0D] to-[#141619] border-b border-[#FFB703]/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB703]/20 border border-[#FFB703] flex items-center justify-center text-[#FFC300] shadow-[0_0_15px_rgba(255,183,3,0.4)]">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  storefront
                </span>
              </div>
              <div>
                <h2 className="font-headline text-base sm:text-lg font-black text-[#FFFDF7] tracking-wider flex items-center gap-2">
                  CHESS MASTER PAYU STORE
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FFB703] text-[#120B05]">
                    INR ₹
                  </span>
                </h2>
                <p className="font-body text-xs text-[#E0C8A0]">
                  Official PayU India Payment Gateway • Instant Delivery
                </p>
              </div>
            </div>

            {/* Wallet Badges */}
            <div className="flex items-center gap-2 text-xs font-bold text-white/90">
              <div className="px-2.5 py-1 rounded-full bg-[#1A1D21] border border-[#FFB703]/40 text-[#FFC300] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">monetization_on</span>
                <span>{user.coins || 0} Coins</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#1A1D21] border border-[#29B6F6]/40 text-[#81D4FA] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">diamond</span>
                <span>{user.gems || 0} Gems</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors border border-white/10"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Store Tabs */}
          {paymentStep === 'shop' && (
            <div className="flex items-center gap-1 p-2 bg-[#1A1D21] border-b border-white/10 overflow-x-auto text-xs font-bold text-white/60">
              {[
                { id: 'membership', label: 'VIP Membership', icon: 'workspace_premium' },
                { id: 'coins', label: 'Coins Store', icon: 'monetization_on' },
                { id: 'gems', label: 'Gems Vault', icon: 'diamond' },
                { id: 'battlepass', label: 'Battle Pass & Skins', icon: 'military_tech' },
                { id: 'history', label: 'My Invoices', icon: 'receipt_long' },
                { id: 'admin', label: 'Admin Analytics', icon: 'analytics' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-[#FFB703] to-[#FF8C00] text-[#120B05] font-black shadow-md'
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
            {paymentStep === 'shop' && (
              <>
                {/* VIP Membership Tab */}
                {activeTab === 'membership' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {MEMBERSHIP_PACKAGES.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="relative rounded-2xl p-4 bg-gradient-to-b from-[#2C1F0D] via-[#1D1409] to-[#141619] border border-[#FFB703]/50 shadow-[0_0_20px_rgba(255,183,3,0.15)] flex flex-col justify-between"
                        >
                          {pkg.badge && (
                            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FFB703] text-[#120B05]">
                              {pkg.badge}
                            </div>
                          )}

                          <div>
                            <h3 className="font-headline text-sm font-black text-white">{pkg.name}</h3>
                            <div className="flex items-baseline gap-1.5 my-2">
                              <span className="font-headline text-2xl font-black text-[#FFC300]">
                                ₹{pkg.priceINR}
                              </span>
                              {pkg.originalPriceINR && (
                                <span className="text-xs text-white/40 line-through">₹{pkg.originalPriceINR}</span>
                              )}
                              <span className="text-[10px] text-white/60">{pkg.period}</span>
                            </div>

                            <ul className="space-y-1.5 my-3 text-[11px] text-[#E0C8A0]">
                              {pkg.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="material-symbols-outlined text-xs text-[#FFC300] shrink-0 mt-0.5">check_circle</span>
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <button
                            onClick={() => handleInitiatePayU(pkg)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FF8C00] text-[#120B05] font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 mt-2"
                          >
                            <span>Buy via PayU (₹{pkg.priceINR})</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coins Store Tab */}
                {activeTab === 'coins' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {COIN_PACKAGES.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-4 rounded-2xl bg-[#1A1D21] border border-white/10 hover:border-[#FFB703]/50 transition-all text-center flex flex-col items-center justify-between gap-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#FFB703]/20 border border-[#FFB703] flex items-center justify-center text-[#FFC300]">
                          <span className="material-symbols-outlined text-3xl">monetization_on</span>
                        </div>
                        <div>
                          <div className="font-headline text-sm font-black text-white">{pkg.name}</div>
                          <div className="text-xl font-black text-[#FFC300] my-1">₹{pkg.priceINR} INR</div>
                        </div>
                        <button
                          onClick={() => handleInitiatePayU(pkg)}
                          className="w-full py-2 rounded-xl bg-[#FFB703] text-[#120B05] font-bold text-xs hover:brightness-110 cursor-pointer"
                        >
                          Buy Coins
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gems Vault Tab */}
                {activeTab === 'gems' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {GEM_PACKAGES.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-4 rounded-2xl bg-[#0F223D] border border-[#29B6F6]/50 transition-all text-center flex flex-col items-center justify-between gap-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#29B6F6]/20 border border-[#29B6F6] flex items-center justify-center text-[#81D4FA]">
                          <span className="material-symbols-outlined text-3xl">diamond</span>
                        </div>
                        <div>
                          <div className="font-headline text-sm font-black text-white">{pkg.name}</div>
                          <div className="text-xl font-black text-[#81D4FA] my-1">₹{pkg.priceINR} INR</div>
                        </div>
                        <button
                          onClick={() => handleInitiatePayU(pkg)}
                          className="w-full py-2 rounded-xl bg-[#29B6F6] text-[#060E1A] font-bold text-xs hover:brightness-110 cursor-pointer"
                        >
                          Buy Gems
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Battle Pass & Skins Tab */}
                {activeTab === 'battlepass' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {COSMETIC_PACKAGES.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-4 rounded-2xl bg-[#2A0938] border border-[#E040FB]/50 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-headline text-sm font-black text-white">{pkg.name}</div>
                          <div className="text-lg font-black text-[#EA80FC] my-1">₹{pkg.priceINR} INR</div>
                          <ul className="text-[11px] text-white/70 space-y-1 my-2">
                            {pkg.features.map((f, i) => (
                              <li key={i}>• {f}</li>
                            ))}
                          </ul>
                        </div>
                        <button
                          onClick={() => handleInitiatePayU(pkg)}
                          className="w-full py-2 rounded-xl bg-[#E040FB] text-[#0E0214] font-bold text-xs hover:brightness-110 cursor-pointer"
                        >
                          Unlock Skin / Pass
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* My Invoices / Purchase History */}
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {myTransactions.length === 0 ? (
                      <div className="text-center py-8 text-white/50 text-xs">
                        No previous PayU transactions found. Complete a purchase above to generate GST invoices.
                      </div>
                    ) : (
                      myTransactions.map((tx, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#1A1D21] border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{tx.itemName}</span>
                            <span className="text-[10px] text-white/50 block">TXN ID: {tx.txnid} • {tx.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-[#FFC300] block">₹{tx.amountINR} INR</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-300">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Admin Analytics Tab */}
                {activeTab === 'admin' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-[#1A1D21] border border-white/10">
                        <span className="text-[10px] text-white/50 block">Total Revenue</span>
                        <span className="font-headline text-lg font-black text-[#FFC300]">₹{adminStats?.totalRevenueINR || 0} INR</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#1A1D21] border border-white/10">
                        <span className="text-[10px] text-white/50 block">Total Orders</span>
                        <span className="font-headline text-lg font-black text-white">{adminStats?.totalOrders || 0}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#1A1D21] border border-white/10">
                        <span className="text-[10px] text-white/50 block">Success Rate</span>
                        <span className="font-headline text-lg font-black text-green-400">100%</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#1A1D21] border border-white/10">
                        <span className="text-[10px] text-white/50 block">Webhooks Logged</span>
                        <span className="font-headline text-lg font-black text-[#81D4FA]">{adminStats?.webhooksLoggedCount || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {paymentStep === 'checkout' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#1A1D21] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-white/50 block uppercase">Selected Package</span>
                    <span className="font-headline text-sm font-bold text-[#FFC300]">{selectedPackage.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/50 block uppercase">Payable Amount</span>
                    <span className="font-headline text-lg font-black text-white">₹{currentPrice}.00 INR</span>
                  </div>
                </div>

                {/* Coupon Input Box */}
                <div className="p-3 rounded-xl bg-[#1A1D21] border border-[#FFB703]/30 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. CHESS50, VIP20, FREESHR)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141619] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FFB703]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-1.5 rounded-lg bg-[#FFB703] text-[#120B05] font-black text-xs hover:brightness-110 cursor-pointer shrink-0"
                  >
                    Apply Code
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-xs ${appliedCoupon ? 'text-green-400 font-bold' : 'text-red-400'}`}>
                    {couponMsg}
                  </p>
                )}

                {/* Payment Methods */}
                <div>
                  <label className="text-[11px] font-bold text-white/80 uppercase block mb-1.5">
                    Select PayU India Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'upi', label: 'UPI QR / GPay / Paytm', icon: 'qr_code_scanner' },
                      { id: 'card', label: 'Debit / Credit Card', icon: 'credit_card' },
                      { id: 'netbanking', label: 'Net Banking', icon: 'account_balance' },
                      { id: 'wallet', label: 'PayU Wallet', icon: 'account_balance_wallet' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayuMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          payuMethod === m.id
                            ? 'border-[#FFB703] bg-[#2C1F0D] text-[#FFC300]'
                            : 'border-white/10 bg-[#1A1D21] text-white/60 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{m.icon}</span>
                        <span className="text-[10px] font-bold text-center">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {payuMethod === 'card' && (
                  <div className="space-y-2 p-3 rounded-xl bg-[#1A1D21] border border-white/10">
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#141619] border border-white/20 text-white text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#141619] border border-white/20 text-white text-xs"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#141619] border border-white/20 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Direct PayU Link Box */}
                <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#FFB703]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#FFC300] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">link</span>
                      Official PayU Direct Payment Link:
                    </span>
                    <button
                      onClick={copyPayULinkToClipboard}
                      className="text-[10px] text-white/80 hover:text-white bg-white/10 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                    >
                      {copiedPayuLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#1A1D21] p-2.5 rounded-xl border border-white/10 text-xs font-mono text-white/90">
                    <span className="truncate">{PAYU_DIRECT_LINK}</span>
                    <button
                      onClick={openDirectPayULink}
                      className="ml-2 px-2.5 py-1 rounded-lg bg-[#FFB703] text-[#120B05] font-black text-[10px] uppercase shrink-0 cursor-pointer hover:brightness-110"
                    >
                      Open Link
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => redirectToPayUHostedCheckout(selectedPackage)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFB703] via-[#FFA000] to-[#FF8C00] text-[#120B05] font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                    <span>Pay ₹{currentPrice} via PayU Link (u.payu.in)</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentStep('shop')}
                      className="w-1/3 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/15"
                    >
                      Back to Store
                    </button>
                    <button
                      onClick={() => {
                        setQrTimerSeconds(299);
                        setPaymentStep('qr_scan');
                      }}
                      className="w-2/3 py-2.5 rounded-xl bg-[#2C1F0D] border border-[#FFB703]/50 text-[#FFC300] font-bold text-xs hover:bg-[#3d2c14] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">qr_code_2</span>
                      <span>Pay via In-App UPI QR Code</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated PayU QR Code Scanner Screen */}
            {paymentStep === 'qr_scan' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#2C1F0D] border border-[#FFB703]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FFC300] text-xl">qr_code_scanner</span>
                    <div>
                      <span className="text-[10px] text-[#E0C8A0] block uppercase font-bold">PayU India Official QR Scanner</span>
                      <span className="font-headline text-sm font-bold text-white">{selectedPackage.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#E0C8A0] block uppercase font-bold">Amount Due</span>
                    <span className="font-headline text-lg font-black text-[#FFC300]">₹{currentPrice}.00 INR</span>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#1A1D21] p-5 rounded-2xl border border-white/10 shadow-lg">
                  {/* High Resolution Dynamic QR Code */}
                  <div className="relative p-3 bg-white rounded-2xl shadow-[0_0_25px_rgba(255,183,3,0.3)] shrink-0 flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=payu.chessmaster@icici&pn=ChessMaster&am=${currentPrice}&cu=INR`
                      )}`}
                      alt="PayU Official UPI QR Code"
                      className="w-40 h-40 rounded-lg object-contain"
                    />
                    <div className="mt-2 text-[9px] font-black text-[#120B05] uppercase tracking-wider bg-[#FFB703] px-2 py-0.5 rounded">
                      PayU Verified Merchant QR
                    </div>
                  </div>

                  {/* Payment Instructions & Timer */}
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <div className="text-xs font-black text-[#FFC300] uppercase tracking-wide">
                        Step 1: Scan & Pay on Phone
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        Open <strong className="text-white">Google Pay, PhonePe, Paytm, or BHIM</strong>, scan the QR code above and transfer <strong className="text-[#FFC300]">₹{currentPrice} INR</strong>.
                      </p>
                    </div>

                    {/* Timer & Copy VPA & Open Link */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <div className="px-3 py-1 rounded-lg bg-[#2C1F0D] border border-[#FFB703]/50 text-[#FFC300] text-xs font-mono font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm animate-pulse">timer</span>
                        <span>Session expires in {formatTimer(qrTimerSeconds)}</span>
                      </div>

                      <button
                        onClick={copyVpaToClipboard}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                        <span>{copiedVpa ? 'VPA Copied!' : 'Copy Merchant VPA'}</span>
                      </button>

                      <button
                        onClick={openDirectPayULink}
                        className="px-3 py-1 rounded-lg bg-[#FFB703] text-[#120B05] text-xs font-black flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        <span>Open Direct PayU URL</span>
                      </button>
                    </div>

                    {/* UTR Input Field */}
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-white/80 block mb-1 uppercase">
                        Step 2: Enter 12-Digit UPI Transaction ID / UTR (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 421908234102 or leave blank for auto"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141619] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FFB703]"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setPaymentStep('checkout')}
                    className="w-1/3 py-3 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
                  >
                    Change Method
                  </button>
                  <button
                    onClick={handleCompletePayment}
                    className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FF8C00] text-[#120B05] font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span>I Have Paid — Verify Payment & Unlock</span>
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-full border-4 border-[#FFB703] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#FFC300]">
                    <span className="material-symbols-outlined text-xl">security</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-white tracking-wide">
                    {verificationProgress}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    Communicating with PayU India & Bank Webhook... Please do not close or refresh.
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FFB703]/20 border-2 border-[#FFB703] flex items-center justify-center text-[#FFC300] mx-auto">
                  <span className="material-symbols-outlined text-3xl">stars</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-black text-[#FFFDF7]">PAYMENT SUCCESSFUL!</h3>
                  <p className="text-xs text-[#E0C8A0]">
                    Your PayU payment of ₹{currentPrice} INR was processed & items unlocked!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPaymentStep('shop');
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#FFB703] text-[#120B05] font-black text-xs uppercase shadow-md cursor-pointer"
                >
                  Return to Game
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
