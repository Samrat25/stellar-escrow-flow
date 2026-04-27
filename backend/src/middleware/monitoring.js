import { getDatabase } from '../config/database.js';

/**
 * Middleware to track API metrics (response time, status)
 * and Daily Active Users (DAU) if a wallet address is provided in headers/body
 */
const monitoringMiddleware = async (req, res, next) => {
  const start = Date.now();

  // Wait for the request to finish
  res.on('finish', async () => {
    try {
      const db = getDatabase();
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const path = req.path;
      const method = req.method;

      // Track the API metric asynchronously
      await db.apiMetric.create({
        data: {
          path,
          method,
          statusCode,
          responseTime: duration,
        }
      }).catch(err => console.error('Failed to log API metric:', err));

      // Attempt to track DAU if wallet is present
      const walletAddress = req.body?.walletAddress || 
                            req.body?.clientWallet || 
                            req.body?.freelancerWallet || 
                            req.headers['x-wallet-address'];
      
      if (walletAddress && typeof walletAddress === 'string') {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for DATE column
        
        try {
          if (db.$supabase) {
            await db.$supabase.from('DailyActiveUser').upsert(
              { walletAddress, date: today },
              { onConflict: 'walletAddress,date' }
            );
          } else {
            // in memory mock
            await db.dailyActiveUser.create({
              data: { walletAddress, date: new Date(today) }
            });
          }
        } catch (e) {
          console.error('Failed to log DAU:', e);
        }
      }

    } catch (error) {
      console.error('Monitoring middleware error:', error);
    }
  });

  next();
};

export default monitoringMiddleware;
