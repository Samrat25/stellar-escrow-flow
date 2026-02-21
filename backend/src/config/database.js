import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let db = null;

export function initializeDatabase() {
  if (!db) {
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      // Using Supabase - prefer service role key for backend operations
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon';
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        supabaseKey
      );
      
      // Create a Prisma-like interface for Supabase
      db = createSupabaseAdapter(supabase);
      console.log(`Database: Using Supabase PostgreSQL (${keyType} Key)`);
      
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️  WARNING: Using ANON key - some operations may fail!');
        console.warn('   Add SUPABASE_SERVICE_ROLE_KEY to .env for full functionality');
      }
      
      console.log('⚠️  Make sure to run the SQL schema in Supabase SQL Editor!');
      console.log('   See backend/supabase-schema.sql');
    } else {
      // Using in-memory storage for development/testing
      db = createInMemoryDatabase();
      console.log('Database: Using in-memory storage (development mode)');
    }
  }
  return db;
}

// Adapter to make Supabase work like Prisma
function createSupabaseAdapter(supabase) {
  // Test connection and fall back to in-memory if tables don't exist
  let useInMemory = false;
  
  const checkAndFallback = async (operation) => {
    if (useInMemory) {
      return null;
    }
    
    try {
      return await operation();
    } catch (error) {
      if (error.message?.includes('Could not find the table') || 
          error.message?.includes('relation') ||
          error.code === 'PGRST116') {
        console.warn('⚠️  Supabase tables not found, falling back to in-memory database');
        console.warn('   Run the SQL in backend/supabase-schema.sql in Supabase SQL Editor');
        useInMemory = true;
        
        // Switch to in-memory database
        db = createInMemoryDatabase();
        return null;
      }
      throw error;
    }
  };
  
  return {
    escrow: {
      findUnique: async ({ where, include }) => {
        let query = supabase.from('Escrow').select('*');
        
        if (where.id) query = query.eq('id', where.id);
        if (where.escrowId) query = query.eq('escrowId', where.escrowId);
        
        const { data, error } = await query.single();
        if (error) return null;
        
        if (include?.milestones && data) {
          const { data: milestones } = await supabase
            .from('Milestone')
            .select('*')
            .eq('escrowId', data.id)
            .order('milestoneIndex', { ascending: true });
          data.milestones = milestones || [];
        }
        
        return data;
      },
      
      findMany: async (query) => {
        let supabaseQuery = supabase.from('Escrow').select('*');
        
        if (query?.where) {
          if (query.where.clientWallet) {
            supabaseQuery = supabaseQuery.eq('clientWallet', query.where.clientWallet);
          }
          if (query.where.freelancerWallet) {
            supabaseQuery = supabaseQuery.eq('freelancerWallet', query.where.freelancerWallet);
          }
          if (query.where.OR) {
            // Supabase doesn't support OR directly, so we need to fetch and filter
            const { data: allData } = await supabase.from('Escrow').select('*');
            const filtered = allData?.filter(e => 
              query.where.OR.some(condition => 
                (condition.clientWallet && e.clientWallet === condition.clientWallet) ||
                (condition.freelancerWallet && e.freelancerWallet === condition.freelancerWallet)
              )
            ) || [];
            
            if (query?.include?.milestones) {
              for (const escrow of filtered) {
                const { data: milestones } = await supabase
                  .from('Milestone')
                  .select('*')
                  .eq('escrowId', escrow.id)
                  .order('milestoneIndex', { ascending: true });
                escrow.milestones = milestones || [];
              }
            }
            
            return filtered;
          }
        }
        
        if (query?.orderBy) {
          const key = Object.keys(query.orderBy)[0];
          const direction = query.orderBy[key] === 'desc' ? { ascending: false } : { ascending: true };
          supabaseQuery = supabaseQuery.order(key, direction);
        }
        
        const { data, error } = await supabaseQuery;
        if (error) return [];
        
        if (query?.include?.milestones && data) {
          for (const escrow of data) {
            const { data: milestones } = await supabase
              .from('Milestone')
              .select('*')
              .eq('escrowId', escrow.id)
              .order('milestoneIndex', { ascending: true });
            escrow.milestones = milestones || [];
          }
        }
        
        return data || [];
      },
      
      create: async ({ data: escrowData }) => {
        const milestones = escrowData.milestones?.create;
        delete escrowData.milestones;
        
        const { data, error } = await supabase
          .from('Escrow')
          .insert(escrowData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        
        if (milestones && data) {
          const milestonesToInsert = milestones.map(m => ({
            ...m,
            escrowId: data.id
          }));
          
          const { data: createdMilestones } = await supabase
            .from('Milestone')
            .insert(milestonesToInsert)
            .select();
          
          data.milestones = createdMilestones || [];
        }
        
        return data;
      },
      
      update: async ({ where, data: updateData }) => {
        const { data, error } = await supabase
          .from('Escrow')
          .update(updateData)
          .eq('id', where.id)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      },
      
      count: async () => {
        const { count } = await supabase
          .from('Escrow')
          .select('*', { count: 'exact', head: true });
        return count || 0;
      }
    },
    
    milestone: {
      findUnique: async ({ where, include }) => {
        const { data, error } = await supabase
          .from('Milestone')
          .select('*')
          .eq('id', where.id)
          .single();
        
        if (error) return null;
        
        if (include?.escrow && data) {
          const { data: escrow } = await supabase
            .from('Escrow')
            .select('*')
            .eq('id', data.escrowId)
            .single();
          data.escrow = escrow;
        }
        
        return data;
      },
      
      findMany: async (query) => {
        let supabaseQuery = supabase.from('Milestone').select('*');
        
        if (query?.where) {
          if (query.where.escrowId) {
            supabaseQuery = supabaseQuery.eq('escrowId', query.where.escrowId);
          }
          if (query.where.status) {
            supabaseQuery = supabaseQuery.eq('status', query.where.status);
          }
        }
        
        if (query?.orderBy) {
          const key = Object.keys(query.orderBy)[0];
          const direction = query.orderBy[key] === 'desc' ? { ascending: false } : { ascending: true };
          supabaseQuery = supabaseQuery.order(key, direction);
        }
        
        const { data, error } = await supabaseQuery;
        return data || [];
      },
      
      findFirst: async (query) => {
        let supabaseQuery = supabase.from('Milestone').select('*');
        
        if (query?.where) {
          if (query.where.escrowId) {
            supabaseQuery = supabaseQuery.eq('escrowId', query.where.escrowId);
          }
          if (query.where.milestoneIndex) {
            supabaseQuery = supabaseQuery.eq('milestoneIndex', query.where.milestoneIndex);
          }
        }
        
        const { data, error } = await supabaseQuery.limit(1).single();
        return data;
      },
      
      create: async ({ data: milestoneData }) => {
        const { data, error } = await supabase
          .from('Milestone')
          .insert(milestoneData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      },
      
      update: async ({ where, data: updateData }) => {
        const { data, error } = await supabase
          .from('Milestone')
          .update(updateData)
          .eq('id', where.id)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      },
      
      count: async () => {
        const { count } = await supabase
          .from('Milestone')
          .select('*', { count: 'exact', head: true });
        return count || 0;
      }
    },
    
    user: {
      findUnique: async ({ where }) => {
        let query = supabase.from('User').select('*');
        
        if (where.id) query = query.eq('id', where.id);
        if (where.walletAddress) query = query.eq('walletAddress', where.walletAddress);
        
        const { data, error } = await query.single();
        return data;
      },
      
      findMany: async (query) => {
        const { data, error } = await supabase.from('User').select('*');
        return data || [];
      },
      
      create: async ({ data: userData }) => {
        const { data, error } = await supabase
          .from('User')
          .insert(userData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      },
      
      update: async ({ where, data: updateData }) => {
        let query = supabase.from('User').update(updateData);
        
        if (where.id) query = query.eq('id', where.id);
        if (where.walletAddress) query = query.eq('walletAddress', where.walletAddress);
        
        const { data, error } = await query.select().single();
        
        if (error) throw new Error(error.message);
        return data;
      },
      
      upsert: async ({ where, update, create }) => {
        const existing = await supabase
          .from('User')
          .select('*')
          .eq('walletAddress', where.walletAddress)
          .single();
        
        if (existing.data) {
          const { data, error } = await supabase
            .from('User')
            .update(update)
            .eq('walletAddress', where.walletAddress)
            .select()
            .single();
          return data;
        } else {
          const { data, error } = await supabase
            .from('User')
            .insert(create)
            .select()
            .single();
          return data;
        }
      }
    },
    
    feedback: {
      findUnique: async ({ where }) => {
        const { data, error } = await supabase
          .from('Feedback')
          .select('*')
          .eq('id', where.id)
          .single();
        return data;
      },
      
      findMany: async (query) => {
        let supabaseQuery = supabase.from('Feedback').select('*');
        
        if (query?.where) {
          if (query.where.escrowId) {
            supabaseQuery = supabaseQuery.eq('escrowId', query.where.escrowId);
          }
          if (query.where.userId) {
            supabaseQuery = supabaseQuery.eq('userId', query.where.userId);
          }
          if (query.where.fromWallet) {
            supabaseQuery = supabaseQuery.eq('fromWallet', query.where.fromWallet);
          }
        }
        
        const { data, error } = await supabaseQuery;
        return data || [];
      },
      
      create: async ({ data: feedbackData }) => {
        const { data, error } = await supabase
          .from('Feedback')
          .insert(feedbackData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      },
      
      count: async () => {
        const { count } = await supabase
          .from('Feedback')
          .select('*', { count: 'exact', head: true });
        return count || 0;
      }
    },
    
    transactionLog: {
      findMany: async (query) => {
        let supabaseQuery = supabase.from('TransactionLog').select('*');
        
        if (query?.where?.escrowId) {
          supabaseQuery = supabaseQuery.eq('escrowId', query.where.escrowId);
        }
        
        const { data, error } = await supabaseQuery;
        return data || [];
      },
      
      create: async ({ data: logData }) => {
        const { data, error } = await supabase
          .from('TransactionLog')
          .insert(logData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      }
    },
    
    agentLog: {
      findUnique: async ({ where }) => {
        const { data, error } = await supabase
          .from('AgentLog')
          .select('*')
          .eq('id', where.id)
          .single();
        return data;
      },
      
      findMany: async (query) => {
        let supabaseQuery = supabase.from('AgentLog').select('*');
        
        if (query?.where) {
          if (query.where.createdAt?.gte) {
            supabaseQuery = supabaseQuery.gte('createdAt', query.where.createdAt.gte.toISOString());
          }
          if (query.where.escrowId) {
            supabaseQuery = supabaseQuery.eq('escrowId', query.where.escrowId);
          }
          if (query.where.agentType) {
            supabaseQuery = supabaseQuery.eq('agentType', query.where.agentType);
          }
        }
        
        if (query?.orderBy) {
          const key = Object.keys(query.orderBy)[0];
          const direction = query.orderBy[key] === 'desc' ? { ascending: false } : { ascending: true };
          supabaseQuery = supabaseQuery.order(key, direction);
        }
        
        if (query?.take) {
          supabaseQuery = supabaseQuery.limit(query.take);
        }
        
        const { data, error } = await supabaseQuery;
        return data || [];
      },
      
      create: async ({ data: logData }) => {
        const { data, error } = await supabase
          .from('AgentLog')
          .insert(logData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      }
    },
    
    iterationPlan: {
      findMany: async (query) => {
        const { data, error } = await supabase.from('IterationPlan').select('*');
        return data || [];
      },
      
      create: async ({ data: planData }) => {
        const { data, error } = await supabase
          .from('IterationPlan')
          .insert(planData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return data;
      }
    }
  };
}

function createInMemoryDatabase() {
  const data = {
    escrow: [],
    milestone: [],
    feedback: [],
    user: [],
    agentLog: [],
    iterationPlan: [],
    transactionLog: []
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  return {
    escrow: {
      findUnique: ({ where, include }) => {
        const escrow = data.escrow.find(e => 
          (where.id && e.id === where.id) || 
          (where.escrowId && e.escrowId === where.escrowId)
        );
        if (escrow && include?.milestones) {
          escrow.milestones = data.milestone.filter(m => m.escrowId === escrow.id);
        }
        return Promise.resolve(escrow);
      },
      findMany: (query) => {
        const filtered = data.escrow.filter(e => {
          if (!query?.where) return true;
          if (query.where.clientWallet) return e.clientWallet === query.where.clientWallet;
          if (query.where.freelancerWallet) return e.freelancerWallet === query.where.freelancerWallet;
          if (query.where.OR) {
            return query.where.OR.some(condition => {
              if (condition.clientWallet) return e.clientWallet === condition.clientWallet;
              if (condition.freelancerWallet) return e.freelancerWallet === condition.freelancerWallet;
              return false;
            });
          }
          return true;
        });
        
        if (query?.include?.milestones) {
          filtered.forEach(e => {
            e.milestones = data.milestone.filter(m => m.escrowId === e.id);
          });
        }
        
        return Promise.resolve(filtered);
      },
      create: ({ data: escrowData }) => Promise.resolve({
        ...escrowData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).then(e => {
        // Handle nested milestone creation
        if (escrowData.milestones?.create) {
          const milestones = escrowData.milestones.create.map(m => ({
            ...m,
            id: generateId(),
            escrowId: e.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          data.milestone.push(...milestones);
          e.milestones = milestones;
        }
        data.escrow.push(e);
        return e;
      }),
      update: ({ where, data: updateData }) => {
        const idx = data.escrow.findIndex(e => e.id === where.id);
        if (idx !== -1) {
          data.escrow[idx] = { ...data.escrow[idx], ...updateData, updatedAt: new Date() };
          return Promise.resolve(data.escrow[idx]);
        }
        return Promise.reject(new Error('Escrow not found'));
      },
      count: () => Promise.resolve(data.escrow.length)
    },

    milestone: {
      findUnique: ({ where }) => Promise.resolve(
        data.milestone.find(m => m.id === where.id)
      ),
      findMany: (query) => Promise.resolve(
        data.milestone.filter(m => {
          if (!query?.where) return true;
          if (query.where.escrowId) return m.escrowId === query.where.escrowId;
          if (query.where.status) return m.status === query.where.status;
          return true;
        })
      ),
      create: ({ data: milestoneData }) => Promise.resolve({
        ...milestoneData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).then(m => {
        data.milestone.push(m);
        return m;
      }),
      update: ({ where, data: updateData }) => {
        const idx = data.milestone.findIndex(m => m.id === where.id);
        if (idx !== -1) {
          data.milestone[idx] = { ...data.milestone[idx], ...updateData, updatedAt: new Date() };
          return Promise.resolve(data.milestone[idx]);
        }
        return Promise.reject(new Error('Milestone not found'));
      },
      count: () => Promise.resolve(data.milestone.length)
    },

    feedback: {
      findUnique: ({ where }) => Promise.resolve(
        data.feedback.find(f => f.id === where.id)
      ),
      findMany: (query) => Promise.resolve(
        data.feedback.filter(f => {
          if (!query?.where) return true;
          if (query.where.escrowId) return f.escrowId === query.where.escrowId;
          if (query.where.fromWallet) return f.fromWallet === query.where.fromWallet;
          return true;
        })
      ),
      create: ({ data: feedbackData }) => Promise.resolve({
        ...feedbackData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).then(f => {
        data.feedback.push(f);
        return f;
      }),
      count: () => Promise.resolve(data.feedback.length)
    },

    user: {
      findUnique: ({ where }) => Promise.resolve(
        data.user.find(u => 
          (where.id && u.id === where.id) || 
          (where.walletAddress && u.walletAddress === where.walletAddress)
        )
      ),
      findMany: (query) => Promise.resolve(data.user),
      create: ({ data: userData }) => Promise.resolve({
        ...userData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        reputation: 0
      }).then(u => {
        data.user.push(u);
        return u;
      }),
      update: ({ where, data: updateData }) => {
        const idx = data.user.findIndex(u => u.id === where.id || u.walletAddress === where.walletAddress);
        if (idx !== -1) {
          data.user[idx] = { ...data.user[idx], ...updateData, updatedAt: new Date() };
          return Promise.resolve(data.user[idx]);
        }
        return Promise.reject(new Error('User not found'));
      },
      upsert: async ({ where, update, create }) => {
        const existing = data.user.find(u => u.walletAddress === where.walletAddress);
        if (existing) {
          const idx = data.user.findIndex(u => u.walletAddress === where.walletAddress);
          data.user[idx] = { ...data.user[idx], ...update, updatedAt: new Date() };
          return Promise.resolve(data.user[idx]);
        } else {
          const newUser = {
            ...create,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            reputation: 0
          };
          data.user.push(newUser);
          return Promise.resolve(newUser);
        }
      }
    },

    agentLog: {
      findUnique: ({ where }) => Promise.resolve(
        data.agentLog.find(l => l.id === where.id)
      ),
      findMany: (query) => Promise.resolve(
        data.agentLog
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, query?.take || 50)
      ),
      create: ({ data: logData }) => Promise.resolve({
        ...logData,
        id: generateId(),
        createdAt: new Date()
      }).then(l => {
        data.agentLog.push(l);
        return l;
      })
    },

    iterationPlan: {
      findMany: (query) => Promise.resolve(data.iterationPlan),
      create: ({ data: planData }) => Promise.resolve({
        ...planData,
        id: generateId(),
        createdAt: new Date()
      }).then(p => {
        data.iterationPlan.push(p);
        return p;
      })
    },

    transactionLog: {
      findMany: (query) => Promise.resolve(data.transactionLog),
      create: ({ data: logData }) => Promise.resolve({
        ...logData,
        id: generateId(),
        createdAt: new Date()
      }).then(l => {
        data.transactionLog.push(l);
        return l;
      })
    }
  };
}

export function getDatabase() {
  if (!db) {
    initializeDatabase();
  }
  return db;
}

// Export as default for compatibility
export { db as default };
