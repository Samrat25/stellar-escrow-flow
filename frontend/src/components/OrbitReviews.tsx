import { useEffect, useState } from 'react';
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
    username: string;
    avatarUrl?: string;
    role: string;
  };
  reviewed: {
    username: string;
    role: string;
  };
}

const OrbitReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isPaused, setIsPaused] = useState(false);

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

  const radius = 280;
  const angleStep = (2 * Math.PI) / reviews.length;

  return (
    <div className="relative w-full h-[700px] flex items-center justify-center overflow-hidden">
      {/* Center Circle */}
      <div className="absolute z-10 flex flex-col items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-2xl">
          <Star className="w-16 h-16 text-white fill-white" />
        </div>
        <p className="mt-4 text-xl font-bold">Real Reviews</p>
        <p className="text-sm text-muted-foreground">From Our Community</p>
      </div>

      {/* Orbit Path */}
      <div className="absolute w-[600px] h-[600px] border-2 border-dashed border-primary/20 rounded-full" />

      {/* Review Cards in Orbit */}
      <div
        className={`absolute w-[600px] h-[600px] ${
          isPaused ? '' : 'animate-spin-slow'
        }`}
        style={{ animationDuration: '60s' }}
      >
        {reviews.map((review, index) => {
          const angle = index * angleStep;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={review.id}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div
                className={`w-64 p-4 rounded-lg glass border border-border shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isPaused ? '' : 'animate-counter-spin-slow'
                }`}
                style={{ animationDuration: '60s' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewer.avatarUrl} />
                    <AvatarFallback>
                      {review.reviewer.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {review.reviewer.username || 'Anonymous'}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {review.reviewer.role}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3">
                  {review.comment || 'Great experience working together!'}
                </p>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Reviewed {review.reviewed.username || 'Anonymous'} •{' '}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes counter-spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow linear infinite;
        }

        .animate-counter-spin-slow {
          animation: counter-spin-slow linear infinite;
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
