import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, CheckCircle2, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

interface NewsletterSubscriptionProps {
  lang: "TR" | "EN";
}

export default function NewsletterSubscription({ lang }: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(
        lang === "TR"
          ? "Lütfen geçerli bir e-posta adresi giriniz."
          : "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if email already exists
      const subscribersCol = collection(db, "newsletter_subscribers");
      const q = query(subscribersCol, where("email", "==", email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setSuccess(true);
        setEmail("");
        setLoading(false);
        return;
      }

      // Add subscriber
      await addDoc(subscribersCol, {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString(),
        active: true,
      });

      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      console.error("Subscription error:", err);
      setError(
        lang === "TR"
          ? "Abone olunurken bir hata oluştu. Lütfen tekrar deneyin."
          : "An error occurred during subscription. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" id="newsletter-subscription-section">
      <div className="absolute top-1/2 right-10 w-[200px] h-[200px] rounded-full purple-glow pointer-events-none -z-10 opacity-15" />
      
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#10111a]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="max-w-xl text-center md:text-left">
            <span className="font-mono text-[10px] text-purple-400 font-extrabold tracking-widest block mb-1 uppercase flex items-center justify-center md:justify-start gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" />
              {lang === "TR" ? "BÜLTENE ABONE OL" : "NEWSLETTER SUBSCRIBE"}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              {lang === "TR" ? "Yayınları ve Çekilişleri Kaçırma!" : "Don't Miss Giveaways & Streams!"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              {lang === "TR"
                ? "Yeni bir duyuru paylaşıldığında, turnuva başladığında ya da sürpriz bir çekiliş yapıldığında anında e-posta bülteniyle haberdar ol."
                : "Get notified instantly via email newsletter when a new announcement is posted, a tournament starts, or a surprise giveaway opens."}
            </p>
          </div>

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {lang === "TR" ? "Harika! Başarıyla Abone Oldun" : "Awesome! Successfully Subscribed"}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {lang === "TR"
                        ? "Seni bülten listemize ekledik. Yeni duyurularda görüşmek üzere!"
                        : "We've added you to our newsletter. See you in the next announcements!"}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleSubscribe}
                  className="space-y-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={lang === "TR" ? "E-posta adresiniz..." : "Your email address..."}
                        className="w-full rounded-2xl border border-white/5 bg-[#090a10] pl-10 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition duration-150"
                        required
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-2xl bg-purple-600 hover:bg-purple-500 px-6 py-3 text-xs font-extrabold text-white transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span>{lang === "TR" ? "Abone Ol" : "Subscribe"}</span>
                      )}
                    </button>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-red-400 font-medium flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
