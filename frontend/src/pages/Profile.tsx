import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStellarWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatXLM } from '@/lib/stellar';
import { ArrowLeft, Edit, Star, User, Briefcase, ExternalLink, Copy, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

const Profile = () => {
  const { wallet } = useParams<{ wallet: string }>();
  const { address } = useStellarWallet();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatarUrl: '',
    role: 'CLIENT'
  });

  const isOwnProfile = address && wallet && address.toLowerCase() === wallet.toLowerCase();

  useEffect(() => {
    if (wallet) {
      loadProfile();
    }
  }, [wallet]);

  const loadProfile = async () => {
    if (!wallet) return;
    
    setLoading(true);
    try {
      const data = await api.getProfile(wallet);
      setProfile(data);
      setFormData({
        username: data.username || '',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
        role: data.role || 'CLIENT'
      });
    } catch (error) {
      console.error('Load profile error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!wallet) return;
    
    try {
      await api.updateProfile({
        walletAddress: wallet,
        ...formData
      });
      
      toast.success('Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const copyWallet = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet);
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">Profile not found</p>
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isFreelancer = profile.role === 'FREELANCER';

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="grid gap-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback>
                      {profile.username?.[0]?.toUpperCase() || wallet?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {profile.username || `${wallet?.slice(0, 8)}...${wallet?.slice(-6)}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={copyWallet}
                        className="flex items-center gap-2 text-sm text-muted-foreground font-mono hover:text-foreground transition-colors"
                      >
                        {wallet?.slice(0, 12)}...{wallet?.slice(-8)}
                        {copied ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Show badges based on actual activity */}
                      {profile.stats.totalEarnings > 0 && (
                        <Badge variant="secondary">
                          <Briefcase className="h-3 w-3 mr-1" />
                          Freelancer
                        </Badge>
                      )}
                      {profile.stats.totalSpending > 0 && (
                        <Badge variant="default">
                          <User className="h-3 w-3 mr-1" />
                          Client
                        </Badge>
                      )}
                      {profile.stats.totalEarnings === 0 && profile.stats.totalSpending === 0 && (
                        <Badge variant="outline">
                          {profile.role === 'CLIENT' ? <User className="h-3 w-3 mr-1" /> : <Briefcase className="h-3 w-3 mr-1" />}
                          {profile.role}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{profile.stats.averageRating}</span>
                        <span className="text-xs text-muted-foreground">({profile.stats.totalReviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
                {isOwnProfile && !editing && (
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="CLIENT">Client</option>
                      <option value="FREELANCER">Freelancer</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button onClick={() => setEditing(false)} variant="outline">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats - Show BOTH earnings and spending */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <p className="text-3xl font-bold text-green-600">{formatXLM(profile.stats.totalEarnings)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                    <p className="text-3xl font-bold text-blue-600">{formatXLM(profile.stats.totalSpending)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{profile.stats.milestonesCreated}</p>
                  <p className="text-sm text-muted-foreground mt-1">Created</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{profile.stats.milestonesCompleted}</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History - Shows BOTH earnings and spending */}
          {profile.transactionHistory && profile.transactionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <p className="text-sm text-muted-foreground">All your completed milestones</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.transactionHistory.map((tx: any) => (
                    <div key={tx.milestoneId} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={tx.type === 'EARNING' ? 'default' : 'secondary'} className="text-xs">
                              {tx.type === 'EARNING' ? (
                                <><TrendingUp className="h-3 w-3 mr-1" />Earned</>
                              ) : (
                                <><TrendingDown className="h-3 w-3 mr-1" />Spent</>
                              )}
                            </Badge>
                            <p className="font-medium">{tx.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {tx.milestoneId.slice(0, 8)}...
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {tx.otherPartyLabel}: {tx.otherParty.slice(0, 16)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {tx.approvedAt && (
                              <span>{new Date(tx.approvedAt).toLocaleDateString()}</span>
                            )}
                            {tx.approvalTxHash && (
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${tx.approvalTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Transaction
                              </a>
                            )}
                            {tx.submissionCid && (
                              <a
                                href={tx.submissionUrl || `https://gateway.pinata.cloud/ipfs/${tx.submissionCid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Work
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${tx.type === 'EARNING' ? 'text-green-600' : 'text-blue-600'}`}>
                            {tx.type === 'EARNING' ? '+' : '-'}{formatXLM(tx.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews Received</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.reviews && profile.reviews.length > 0 ? (
                <div className="space-y-4">
                  {profile.reviews.map((review: any) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {review.reviewer.username?.[0]?.toUpperCase() || review.reviewer.walletAddress.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/profile/${review.reviewer.walletAddress}`}
                              className="font-medium hover:underline"
                            >
                              {review.reviewer.username || `${review.reviewer.walletAddress.slice(0, 8)}...${review.reviewer.walletAddress.slice(-6)}`}
                            </Link>
                            <Badge variant="outline" className="text-xs">
                              {review.reviewer.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {review.reviewer.walletAddress.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <Badge variant="outline" className="text-xs">
                          {review.roleType === 'CLIENT_REVIEW' ? 'Client Review' : 'Freelancer Review'}
                        </Badge>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reviews yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
