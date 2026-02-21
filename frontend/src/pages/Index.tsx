import { motion } from 'framer-motion';
import { Shield, ArrowRight, Globe, Lock, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HowItWorks from '@/components/HowItWorks';
import { useStellarWallet } from '@/contexts/WalletContext';
import { useEffect } from 'react';

const Index = () => {
  const { address } = useStellarWallet();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to dashboard if wallet is connected
    if (address) {
      navigate('/dashboard');
    }
  }, [address, navigate]);
  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
              <Zap className="h-3.5 w-3.5" />
              Powered by Stellar Soroban Testnet
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Trustless Escrow for the{' '}
              <span className="text-gradient">Decentralized</span>{' '}
              Economy
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Milestone-based payments locked in smart contracts. No middlemen,
              no disputes — just transparent, verifiable transactions on Stellar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard/client">
                <Button size="lg" className="text-base gap-2 px-8">
                  Launch App <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-base gap-2 px-8">
                  <Globe className="h-4 w-4" /> Explore on Testnet
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: 'Escrows Created', value: '24+' },
              { label: 'XLM Locked', value: '50,000' },
              { label: 'Milestones Approved', value: '89' },
              { label: 'Active Users', value: '12' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Transparency */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">
                100% <span className="text-gradient">Verifiable</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Every transaction, milestone approval, and fund release is recorded immutably
                on the Stellar Testnet. Anyone can verify the state of an escrow on the
                Stellar Explorer.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: 'Funds locked in Soroban smart contracts' },
                  { icon: Lock, text: 'No single party can withdraw without approval' },
                  { icon: Globe, text: 'All transactions visible on Stellar Explorer' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-6 font-mono text-xs space-y-2"
            >
              <div className="text-muted-foreground">// Soroban Contract Event</div>
              <div className="text-primary">event: milestone_approved</div>
              <div>escrow_id: <span className="text-success">"escrow_001"</span></div>
              <div>milestone: <span className="text-warning">2</span></div>
              <div>amount: <span className="text-primary">2000 XLM</span></div>
              <div>tx_hash: <span className="text-info">"3a8f...c91d"</span></div>
              <div>timestamp: <span className="text-muted-foreground">2026-02-18T14:32:00Z</span></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>TrustPay — Built on Stellar Soroban</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
            <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Explorer</a>
            <Link to="/feedback" className="hover:text-primary transition-colors">Feedback</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
