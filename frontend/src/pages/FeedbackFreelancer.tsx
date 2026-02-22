import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowLeft, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const FeedbackFreelancer = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getFreelancerReviews();
      setReviews(data);
    } catch (error) {
      console.error('Load reviews error:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Freelancer Reviews
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Reviews given to freelancers by clients
            </p>
          </CardHeader>
        </Card>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground">No freelancer reviews yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={review.reviewerAvatar} />
                      <AvatarFallback>
                        {review.reviewerUsername?.[0]?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.reviewerUsername || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            reviewed {review.reviewedUsername || 'Anonymous'}
                          </p>
                        </div>
                        <Badge variant="default">Client</Badge>
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
                        <span className="ml-2 text-sm text-muted-foreground">
                          {review.rating} / 5
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {review.comment}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackFreelancer;
