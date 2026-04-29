import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Briefcase, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ActiveUser {
  walletAddress: string;
  username: string | null;
  timesAsClient: number;
  timesAsFreelancer: number;
  totalMilestones: number;
  completedMilestones: number;
  totalEarned: number;
  totalSpent: number;
  averageRating: number;
  feedbackCount: number;
}

interface NetworkStats {
  totalActiveUsers: number;
  totalUniqueClients: number;
  totalUniqueFreelancers: number;
  totalProjectsCompleted: number;
  totalXlmEscrowed: number;
}

const ActiveUsers = () => {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveUsers();
  }, []);

  const loadActiveUsers = async () => {
    try {
      const response = await api.getActiveUsers();
      setUsers(response.users);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load active users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (user: ActiveUser) => {
    const isClient = user.timesAsClient > 0;
    const isFreelancer = user.timesAsFreelancer > 0;

    if (isClient && isFreelancer) {
      return <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500">Client & Freelancer</Badge>;
    } else if (isClient) {
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Client</Badge>;
    } else if (isFreelancer) {
      return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">Freelancer</Badge>;
    }
    return null;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">Loading active users...</div>
        </div>
      </section>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Active <span className="text-gradient">Testnet Users</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real users transacting on Stellar Testnet with verified on-chain activity
          </p>
        </motion.div>

        {/* Network Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12 max-w-5xl mx-auto"
          >
            <div className="glass rounded-xl p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-gradient">{stats.totalActiveUsers}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Users</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Briefcase className="h-5 w-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{stats.totalUniqueClients}</div>
              <div className="text-xs text-muted-foreground mt-1">Clients</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{stats.totalUniqueFreelancers}</div>
              <div className="text-xs text-muted-foreground mt-1">Freelancers</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Star className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400">{stats.totalProjectsCompleted}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gradient">{stats.totalXlmEscrowed.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground mt-1">XLM Released</div>
            </div>
          </motion.div>
        )}

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {users.map((user, index) => (
            <motion.div
              key={user.walletAddress}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/profile/${user.walletAddress}`}>
                <Card className="glass p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 font-mono truncate">
                        {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {user.walletAddress}
                      </p>
                    </div>
                    {getRoleBadge(user)}
                  </div>

                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed Projects</span>
                      <span className="font-semibold">{user.completedMilestones}</span>
                    </div>

                    {user.totalEarned > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Earned</span>
                        <span className="font-semibold text-green-400">{user.totalEarned.toFixed(2)} XLM</span>
                      </div>
                    )}

                    {user.totalSpent > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-semibold text-blue-400">{user.totalSpent.toFixed(2)} XLM</span>
                      </div>
                    )}

                    {user.averageRating > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{user.averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs">({user.feedbackCount})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActiveUsers;
