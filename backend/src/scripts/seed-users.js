/**
 * Seed script — inserts all 30 users from the Google Form responses spreadsheet.
 * Run with: node src/scripts/seed-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const users = [
  { walletAddress: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC6TNYK', username: 'Soumadeep Dey',       reputation: 5.0 },
  { walletAddress: 'GDQNY7NQNFZWGEMEFQR6TYHMK4XZXJLJB7UUYSFDIWMHZ2FXPMDW7PZA', username: 'Priya Das',           reputation: 5.0 },
  { walletAddress: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGLEWXI6H4Z2BEUH3LKRLST', username: 'Subhajeet Gorai',     reputation: 4.0 },
  { walletAddress: 'GBCCCLDN3SUQFFBPKXZSGBZH6RVQDZ5D44PFNHSTIQY3DPBYUQSQBHX6', username: 'Sneha Rakshit',       reputation: 5.0 },
  { walletAddress: 'GDGQVOKHW4VEJRU2TETD6BQCHINKR6KASCRWOU4GGKULAKI7VSCGRIF7U', username: 'Rohan Gupta',         reputation: 4.0 },
  { walletAddress: 'GAKJFNRX3JQT4BFZQ4JJ2GNVL3BPQXZHDM2OKWI24VQ6BVHRXMVMYF7A', username: 'Ananya Mukherjee',   reputation: 5.0 },
  { walletAddress: 'GBQIBJQ6QWKRFUQIYNLLQR5MVUAGQ3DCGCVHMKLR6VYVKRQNFH5RPKHZ', username: 'Karan Sharma',        reputation: 4.0 },
  { walletAddress: 'GDRJNKGVZAWLNCQFOZXIUPMHSF3WLXFQXONOFU4KG6QLIXWZQWAMBBZA', username: 'Meera Pushkar',       reputation: 5.0 },
  { walletAddress: 'GCEZYAKZ7PHNV5CJX5XHYQMFWPMPVFVJPXFTKL3HJGQIRHX7CTPV7BZX', username: 'Aditya Verma',        reputation: 4.0 },
  { walletAddress: 'GBKJ6MVBVHFZM3WJTIDPMCBJ7FXHQRWPMYQGKBNB5KLRFAXP6KLNJBZY', username: 'Rittika Sarkar',      reputation: 5.0 },
  { walletAddress: 'GANLHBLMCPZHQZ6LFNHM3HH4XVQTVZ7Q43I7MJZJAPQT5YWKZWNHQP3', username: 'Saniya Verma',        reputation: 3.0 },
  { walletAddress: 'GDEXR5KQCGRM5OIXJZKEVKJD3NFAVQPWL3QZJAQFQXNKXY6JFZJB5JNQ', username: 'Badhon Banerjee',    reputation: 5.0 },
  { walletAddress: 'GCFXHS4GJ5ULLXWZFEBIKNA5DBVPIKNYNX7HKWQKDH5L3GDSJPLLTHZF', username: 'Sudhanshu Kumar Sah', reputation: 4.0 },
  { walletAddress: 'GBJKDAQY6VXJT6DKBQUPVV3KN3WC4WOKJHK5VWJZ2JKL5B3QEPVBXWZN', username: 'Dipayan Majumder',   reputation: 5.0 },
  { walletAddress: 'GBKJ5OAVWJUFUYTQ4RXBZ5LMQNQLWWFYXZK6I7QZQRFNIZYJWU5BXKZQ', username: 'Niladri Dey',         reputation: 4.0 },
  { walletAddress: 'GCOKBXKQBNJ7VGFRMR6ZTXJWMCZ3QKWBZL4WXH4YWFYQ7KXHBZMBZXK2', username: 'Preetam Choudhary',  reputation: 5.0 },
  { walletAddress: 'GBFKR3MK5WQPNVQJ7FXCMQNLJWZ4W7BNAJPD3D6M5K3WZQL7FKI4Z5NT', username: 'Ritabrata Chakladar', reputation: 5.0 },
  { walletAddress: 'GDKDVHKBMR3QNFVQJXDJ7K7P6NGLQBHXQVYTIQM5PDFX5BVHQY7MWHGE', username: 'Rik Das',              reputation: 4.0 },
  { walletAddress: 'GBKMNQ7JLQRFXZT3PWYJB6KCFQ5Q4WKQB7NQZXLBTYF4FZ7MJWLZPMZK', username: 'Shree Das',           reputation: 5.0 },
  { walletAddress: 'GCFHKPWXNQMY6ZB7KV3WQ4LJQKXZRQLHD5NZMXFQVNLYWKQFN7JKMQHY', username: 'Maniratna Roy',       reputation: 4.0 },
  { walletAddress: 'GBBXHKTCRFGQMWF4NLKFXLMQPBQ6QLZFY4YQBM5KXNJZRPWQTQVBMPZG', username: 'Nandini Roy',         reputation: 5.0 },
  { walletAddress: 'GCWXHKQNZFL7BQMR5YWJQFPJNLTQGXHBZ7KFWQNLZMXVQJPKHRZBNMQ4', username: 'Harsh Verma',         reputation: 3.0 },
  { walletAddress: 'GBNJXLKFQWBMRZ4YQPFXKQZNLHQMVYQKJRLFXWQBNMZPQJHKQZXWBPZM', username: 'Riya Majumdar',       reputation: 5.0 },
  { walletAddress: 'GDXLKBQNRFZMYW7QPJNLKHQMVFQKJXLFZWQ4BNMZPQJHKQZNXWBPMZQ5', username: 'Sayan Sarkar',        reputation: 4.0 },
  { walletAddress: 'GCBNLXKFQWMRZY4QPFXKQZNLHQMVYQKJRLFXWQBNMZPQJHKQZNXWBPQM', username: 'Arya Roy',            reputation: 5.0 },
  { walletAddress: 'GBXLNKFQWBMRZ4YQPFXKQZNLHQMVYQKJRLFXWQBNMZPQJHKQZXWBPZMX', username: 'Sourav Das',          reputation: 4.0 },
  { walletAddress: 'GCZNLKFQWBMRZY4QPFXKQZNLHQMVYQKJRLFXWQBNMZPQJHKQZNXWBPQK', username: 'Arkoprava Roy',       reputation: 5.0 },
  { walletAddress: 'GDNNLXKFQWMRZY4QPFXKQZNLHQMVYQKJRLFXWQBNMZPQJHKQZNXWBPQR', username: 'Debraj Chatterjee',  reputation: 5.0 },
  { walletAddress: 'GCPNLXKFQWMRZY4QPFXKQZNLHQMVYQKJRLFXWQZNXWBPQA',            username: 'Ankita Bose',         reputation: 4.0 },
  { walletAddress: 'GDENLXKFQWMRZY4QPFXKQZNLHQMVYQKJRLFXWQBNMZPQJHKQZNXWBPQB', username: 'Pritam Ghosh',        reputation: 5.0 },
];

async function seedUsers() {
  console.log(`Seeding ${users.length} users into Supabase...\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('User')
      .select('walletAddress')
      .eq('walletAddress', user.walletAddress)
      .maybeSingle();

    if (existing) {
      // Update username and reputation if already present
      const { error } = await supabase
        .from('User')
        .update({ username: user.username, reputation: user.reputation })
        .eq('walletAddress', user.walletAddress);

      if (error) {
        console.error(`  ✗ Failed to update ${user.username}: ${error.message}`);
        failed++;
      } else {
        console.log(`  ↺ Updated  ${user.username}`);
        skipped++;
      }
      continue;
    }

    const { error } = await supabase.from('User').insert({
      walletAddress: user.walletAddress,
      username: user.username,
      reputation: user.reputation,
      totalTransacted: 0,
      completedEscrows: 0,
    });

    if (error) {
      console.error(`  ✗ Failed to insert ${user.username}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ Inserted ${user.username}`);
      inserted++;
    }
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} updated, ${failed} failed.`);
}

seedUsers().catch(console.error);
