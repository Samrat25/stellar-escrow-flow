import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();

/**
 * @route GET /metrics/dashboard
 * @desc Get comprehensive metrics for the dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDatabase();
    
    // 1. Get total users
    const users = await db.user.findMany();
    const totalUsers = users.length;

    // 2. Get total transaction volume
    let totalVolume = 0;
    if (db.$supabase) {
      const { data } = await db.$supabase.from('TransactionLog').select('amount').eq('status', 'SUCCESS');
      totalVolume = data?.reduce((sum, log) => sum + log.amount, 0) || 0;
    } else {
      const txLogs = await db.transactionLog.findMany({ where: { status: 'SUCCESS' }});
      totalVolume = txLogs.reduce((sum, log) => sum + log.amount, 0);
    }

    // 3. Get Daily Active Users (DAU) over last 7 days
    let dauLast7Days = [];
    if (db.$supabase) {
      const { data } = await db.$supabase
        .from('DailyActiveUser')
        .select('date, walletAddress')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (data) {
        // Group by date
        const grouped = data.reduce((acc, curr) => {
          acc[curr.date] = acc[curr.date] || new Set();
          acc[curr.date].add(curr.walletAddress);
          return acc;
        }, {});
        
        dauLast7Days = Object.keys(grouped).sort().map(date => ({
          date,
          count: grouped[date].size
        }));
      }
    } else {
      // Mock Data for in-memory
      dauLast7Days = [
        { date: '2026-04-20', count: 12 },
        { date: '2026-04-21', count: 15 },
        { date: '2026-04-22', count: 18 },
        { date: '2026-04-23', count: 20 },
      ];
    }

    // 4. API Response Time (average over last 24h)
    let avgResponseTime = 0;
    let totalRequests = 0;
    let errorCount = 0;
    
    if (db.$supabase) {
      const { data } = await db.$supabase
        .from('ApiMetric')
        .select('responseTime, statusCode')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
      if (data && data.length > 0) {
        totalRequests = data.length;
        avgResponseTime = data.reduce((sum, d) => sum + d.responseTime, 0) / totalRequests;
        errorCount = data.filter(d => d.statusCode >= 400).length;
      }
    } else {
      // Basic mock
      avgResponseTime = 45;
      totalRequests = 100;
      errorCount = 2;
    }

    // 5. Indexed Events Count
    let totalIndexedEvents = 0;
    if (db.$supabase) {
      const { count } = await db.$supabase.from('IndexedEvent').select('*', { count: 'exact', head: true });
      totalIndexedEvents = count || 0;
    } else {
      totalIndexedEvents = await db.indexedEvent.count();
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVolume,
        dau: dauLast7Days,
        apiHealth: {
          avgResponseTime: avgResponseTime || 0,
          totalRequests: totalRequests || 0,
          errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
        },
        totalIndexedEvents
      }
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

/**
 * @route GET /metrics/system-status
 * @desc Get raw system API metrics for monitoring dashboard
 */
router.get('/system-status', async (req, res) => {
  try {
    const db = getDatabase();
    const recentMetrics = await db.apiMetric.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: recentMetrics
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch system status' });
  }
});

export default router;
