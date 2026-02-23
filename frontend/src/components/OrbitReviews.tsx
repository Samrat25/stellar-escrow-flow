import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment: string;
  roleType: string;
  createdAt: string;
  reviewer: {
    walletAddress: string;
    username: string;
    avatarUrl?: string;
    role: string;
  };
  reviewed: {
    walletAddress: string;
    username: string;
    role: string;
  };
}

const OrbitReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await api.getLatestReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  if (reviews.length === 0) {
    return null;
  }

  const getDisplayName = (user: any) => {
    if (user.username) return user.username;
    if (user.walletAddress) {
      return `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`;
    }
    return 'User';
  };

  return (
    <div className="relative w-full py-12 overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Real Reviews</h2>
        <p className="text-muted-foreground">From Our Community</p>
      </div>

      {/* Horizontal scrolling carousel */}
      <div className="relative">
        <div className="flex gap-6 animate-scroll-horizontal pb-4">
          {/* Duplicate reviews for seamless loop */}
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 w-80"
            >
              <div className="h-full p-6 rounded-xl glass border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={review.reviewer.avatarUrl} />
                    <AvatarFallback>
                      {getDisplayName(review.reviewer)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${review.reviewer.walletAddress}`}
                      className="font-medium text-sm hover:underline block truncate"
                    >
                      {getDisplayName(review.reviewer)}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {review.reviewer.walletAddress.slice(0, 16)}...
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {review.reviewer.role}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
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
                </div>

                <p className="text-sm text-muted-foreground line-clamp-4 mb-4">
                  {review.comment || 'Great experience working together!'}
                </p>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Reviewed{' '}
                    <Link
                      to={`/profile/${review.reviewed.walletAddress}`}
                      className="hover:underline"
                    >
                      {getDisplayName(review.reviewed)}
                    </Link>{' '}
                    • {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-horizontal {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-horizontal {
          animation: scroll-horizontal 40s linear infinite;
          width: fit-content;
        }

        .animate-scroll-horizontal:hover {
          animation-play-state: paused;
        }

        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};

export default OrbitReviews;
