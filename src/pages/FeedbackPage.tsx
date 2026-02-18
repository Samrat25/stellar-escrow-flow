import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockFeedback } from '@/lib/mock-data';
import { toast } from 'sonner';

const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState(mockFeedback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!text.trim()) {
      toast.error('Please enter feedback');
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setFeedbackList(prev => [
      { id: String(Date.now()), walletAddress: 'Your Wallet', feedbackText: text, rating, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setRating(0);
    setText('');
    setSubmitting(false);
    toast.success('Thank you for your feedback!');
  };

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Feedback</h1>
          <p className="text-muted-foreground mb-8">Help us improve TrustPay. Your feedback shapes the next iteration.</p>

          <Card className="mb-10 border-border bg-card">
            <CardHeader>
              <CardTitle>Share Your Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= (hoverRating || rating)
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground/30'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="What went well? What could be improved?"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <Button type="submit" disabled={submitting} className="gap-2">
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mb-4">Community Feedback</h2>
          <div className="space-y-3">
            {feedbackList.map((fb, i) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{fb.walletAddress}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-3.5 w-3.5 ${j < fb.rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm">{fb.feedbackText}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackPage;
