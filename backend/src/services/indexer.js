import { getDatabase } from '../config/database.js';
import * as StellarSDK from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_ID = process.env.CONTRACT_ID;
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const sorobanServer = new StellarSDK.rpc.Server(SOROBAN_RPC_URL);

class StellarIndexer {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastCursor = 'now'; // Start from current time if no cursor found
  }

  async init() {
    if (!CONTRACT_ID) {
      console.warn('Indexer disabled: CONTRACT_ID not set');
      return;
    }

    try {
      const db = getDatabase();
      // Find the last indexed cursor
      let lastEvent = null;
      if (db.$supabase) {
        const { data } = await db.$supabase
          .from('IndexedEvent')
          .select('data')
          .order('createdAt', { ascending: false })
          .limit(1)
          .maybeSingle();
        lastEvent = data;
      } else {
        lastEvent = await db.indexedEvent.findFirst();
      }

      if (lastEvent && lastEvent.data && lastEvent.data.paging_token) {
        this.lastCursor = lastEvent.data.paging_token;
      }

      console.log(`[Indexer] Starting from cursor: ${this.lastCursor}`);
      this.start();
    } catch (error) {
      console.error('[Indexer] Initialization failed:', error);
    }
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[Indexer] Service started');

    // Poll every 10 seconds (in production, using Horizon streaming is better, but polling is simpler for this requirement)
    this.intervalId = setInterval(() => this.pollEvents(), 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
    console.log('[Indexer] Service stopped');
  }

  async pollEvents() {
    try {
      // Use Soroban RPC getEvents API
      const latestLedger = await sorobanServer.getLatestLedger();
      const startLedger = latestLedger.sequence - 1000; // Look back ~1000 ledgers (~80min)
      
      const response = await sorobanServer.getEvents({
        startLedger: startLedger > 0 ? startLedger : 1,
        filters: [{
          type: 'contract',
          contractIds: [CONTRACT_ID],
        }],
        pagination: {
          limit: 10,
          cursor: this.lastCursor !== 'now' ? this.lastCursor : undefined,
        },
      });

      if (response.events && response.events.length > 0) {
        for (const record of response.events) {
          await this.processEvent(record);
          if (record.pagingToken) {
            this.lastCursor = record.pagingToken;
          }
        }
      }
    } catch (error) {
      // Ignore timeout errors, log others
      if (error?.response?.status !== 504) {
        console.error('[Indexer] Error polling events:', error.message);
      }
    }
  }

  async processEvent(record) {
    try {
      const db = getDatabase();
      // Determine event type from topics
      let eventType = 'UNKNOWN';
      if (record.topic && record.topic.length > 0) {
        // First topic is usually the symbol/function name
        eventType = record.topic[0];
      }

      const txHash_id = record.transaction_hash + '_' + record.id;
      
      if (db.$supabase) {
        await db.$supabase.from('IndexedEvent').upsert({
          txHash: txHash_id,
          eventType: eventType,
          contractId: CONTRACT_ID,
          data: record,
          ledgerSequence: parseInt(record.ledger),
        }, { onConflict: 'txHash' });
      } else {
        await db.indexedEvent.upsert({
          where: { txHash: txHash_id }, // Make it unique per event
          update: {},
          create: {
            txHash: txHash_id,
            eventType: eventType,
            contractId: CONTRACT_ID,
            data: record,
            ledgerSequence: parseInt(record.ledger),
          }
        });
      }
      
      console.log(`[Indexer] Processed event: ${eventType} at tx ${record.transaction_hash}`);
    } catch (error) {
      console.error('[Indexer] Failed to process event:', error);
    }
  }
}

export const indexerService = new StellarIndexer();
