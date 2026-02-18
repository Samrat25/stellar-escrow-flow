import { motion } from 'framer-motion';
import { FileText, Lock, CheckCircle2, Coins } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Create Escrow',
    description: 'Client defines milestones, amounts, and deadline. Freelancer wallet is linked.',
  },
  {
    icon: Lock,
    title: 'Funds Locked',
    description: 'XLM deposited into Soroban smart contract. Funds are immutably secured on-chain.',
  },
  {
    icon: CheckCircle2,
    title: 'Milestone Approval',
    description: 'Freelancer submits work. Client approves each milestone to release partial funds.',
  },
  {
    icon: Coins,
    title: 'Auto-Release',
    description: 'If the client doesn\'t respond before the deadline, funds auto-release to freelancer.',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="text-gradient">TrustPay</span> Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Four simple steps to trustless, milestone-based payments on Stellar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative group"
            >
              <div className="glass rounded-xl p-6 h-full hover:glow-border transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-mono text-primary mb-2">STEP {i + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
