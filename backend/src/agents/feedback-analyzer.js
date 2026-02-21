import cron from 'node-cron';
import { getDatabase } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Feedback Analyzer Agent
 * Runs every 30 minutes to analyze collected feedback
 * Generates improvement suggestions when feedback reaches threshold
 */

const FEEDBACK_THRESHOLD = 5; // Generate suggestions after 5+ new feedbacks

async function analyzeFeedback() {
  const prisma = getDatabase();
  const analyzeStartTime = new Date();
  console.log(`\n[${analyzeStartTime.toISOString()}] Running feedback analysis...`);

  try {
    // Check for unanalyzed feedback
    const recentFeedback = await prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        escrow: true,
        user: true
      }
    });

    console.log(`[ANALYSIS] Found ${recentFeedback.length} feedback entries`);

    if (recentFeedback.length === 0) {
      console.log('No recent feedback to analyze');
      return;
    }

    // Analyze feedback
    const analysis = {
      totalFeedback: recentFeedback.length,
      avgRating: 0,
      byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      byCategory: {},
      topIssues: [],
      topPraises: []
    };

    let totalRating = 0;

    for (const feedback of recentFeedback) {
      // Rating distribution
      analysis.byRating[feedback.rating]++;
      totalRating += feedback.rating;

      // Category breakdown
      analysis.byCategory[feedback.category] = (analysis.byCategory[feedback.category] || 0) + 1;

      // Sentiment analysis from comments
      if (feedback.comment) {
        const sentiment = analyzeSentiment(feedback.comment);
        if (sentiment === 'negative') {
          extractTopIssues(feedback.comment, analysis.topIssues);
        } else if (sentiment === 'positive') {
          extractTopPraises(feedback.comment, analysis.topPraises);
        }
      }
    }

    analysis.avgRating = parseFloat((totalRating / recentFeedback.length).toFixed(2));

    console.log(`  Average Rating: ${analysis.avgRating}/5`);
    console.log(`  Feedback by Category:`, analysis.byCategory);

    // Log comprehensive feedback analysis
    await prisma.agentLog.create({
      data: {
        agentType: 'FEEDBACK_ANALYSIS',
        action: 'ANALYZE_FEEDBACK',
        status: 'SUCCESS',
        metadata: JSON.stringify(analysis)
      }
    });

    // If we have feedback threshold, generate improvement plan
    if (recentFeedback.length >= FEEDBACK_THRESHOLD) {
      console.log(`  💡 Generating improvement suggestions (${recentFeedback.length} feedbacks)...`);
      
      const improvementPlan = generateImprovementPlan(analysis);
      
      // Create iteration plan
      const plan = await prisma.iterationPlan.create({
        data: {
          title: `Iteration Plan ${new Date().toLocaleDateString()}`,
          description: improvementPlan.description,
          priority: improvementPlan.priority,
          feedbackCount: recentFeedback.length,
          suggestions: improvementPlan.suggestions
        }
      });

      console.log(`  📋 Created iteration plan: ${plan.id}`);

      // Log plan creation
      await prisma.agentLog.create({
        data: {
          agentType: 'FEEDBACK_ANALYSIS',
          action: 'CREATE_ITERATION_PLAN',
          status: 'SUCCESS',
          metadata: JSON.stringify({
            planId: plan.id,
            suggestion_count: improvementPlan.suggestions.length,
            feedback_analyzed: recentFeedback.length
          })
        }
      });
    }

    const analyzeEndTime = new Date();
    const duration = analyzeEndTime - analyzeStartTime;
    console.log(`✅ Analysis completed in ${duration}ms\n`);

  } catch (error) {
    console.error('Feedback analyzer agent error:', error);

    await prisma.agentLog.create({
      data: {
        agentType: 'FEEDBACK_ANALYSIS',
        action: 'ANALYZE_FEEDBACK',
        status: 'FAILED',
        errorMessage: error.message
      }
    }).catch(err => console.error('Failed to log error:', err));
  }
}

/**
 * Analyze sentiment of feedback comment
 */
function analyzeSentiment(comment) {
  const lowerComment = comment.toLowerCase();
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'quick', 'fast', 'reliable', 'easy', 'smooth', 'professional'];
  const negativeWords = ['bad', 'poor', 'slow', 'issue', 'problem', 'broken', 'difficult', 'confusing', 'delayed', 'unprofessional'];

  let positiveCount = positiveWords.filter(word => lowerComment.includes(word)).length;
  let negativeCount = negativeWords.filter(word => lowerComment.includes(word)).length;

  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  return 'neutral';
}

/**
 * Extract key issues from feedback comments
 */
function extractTopIssues(comment, issuesList) {
  const issues = [
    { keyword: ['slow', 'delay'], issue: 'Performance/Speed issues' },
    { keyword: ['confus', 'unclear'], issue: 'UI/UX clarity needed' },
    { keyword: ['bug', 'break', 'error'], issue: 'Technical issues' },
    { keyword: ['communic', 'respond'], issue: 'Communication improvements' },
    { keyword: ['cost', 'fee', 'price'], issue: 'Pricing concerns' }
  ];

  const lowerComment = comment.toLowerCase();
  
  for (const { keyword, issue } of issues) {
    if (keyword.some(kw => lowerComment.includes(kw))) {
      const existing = issuesList.find(i => i.issue === issue);
      if (existing) {
        existing.count++;
      } else {
        issuesList.push({ issue, count: 1 });
      }
    }
  }
}

/**
 * Extract key praises from feedback comments
 */
function extractTopPraises(comment, praiseList) {
  const praises = [
    { keyword: ['fast', 'quick', 'instant'], praise: 'Speed & performance' },
    { keyword: ['easy', 'simple', 'intuitive'], praise: 'Ease of use' },
    { keyword: ['professional', 'reliable'], praise: 'Professionalism' },
    { keyword: ['helpf', 'great', 'excellent'], praise: 'Great service' },
    { keyword: ['secure', 'safe', 'trust'], praise: 'Security & trust' }
  ];

  const lowerComment = comment.toLowerCase();
  
  for (const { keyword, praise } of praises) {
    if (keyword.some(kw => lowerComment.includes(kw))) {
      const existing = praiseList.find(p => p.praise === praise);
      if (existing) {
        existing.count++;
      } else {
        praiseList.push({ praise, count: 1 });
      }
    }
  }
}

/**
 * Generate improvement plan based on feedback analysis
 */
function generateImprovementPlan(analysis) {
  const suggestions = [];
  let priority = 'MEDIUM';

  // Check rating
  if (analysis.avgRating < 4) {
    priority = 'HIGH';
    suggestions.push('Urgent: Average rating below 4. Prioritize critical user experience issues.');
  } else if (analysis.avgRating < 3.5) {
    priority = 'CRITICAL';
    suggestions.push('Critical: Average rating significantly below target. Immediate action required.');
  }

  // Category-based suggestions
  if (analysis.byCategory['GENERAL'] && analysis.byCategory['GENERAL'] > 2) {
    suggestions.push('Review general feedback for systemic improvements');
  }

  // Rating distribution
  const lowRatings = analysis.byRating[1] + analysis.byRating[2];
  if (lowRatings > 0) {
    suggestions.push(`Address issues from ${lowRatings} low ratings - investigate specific problems`);
  }

  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push('Continue monitoring user satisfaction');
    suggestions.push('Maintain current feature quality and performance');
  }

  suggestions.push('Schedule iteration planning meeting');
  suggestions.push('Document learnings for future improvements');

  return {
    description: `Improvement plan generated from ${analysis.totalFeedback} feedback entries. Average satisfaction: ${analysis.avgRating}/5`,
    priority,
    suggestions
  };
}

// Run immediately on start
console.log('🤖 Feedback Analyzer Agent starting...');
analyzeFeedback();

// Schedule to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  analyzeFeedback();
});

console.log('⏰ Scheduled to run every 30 minutes');
