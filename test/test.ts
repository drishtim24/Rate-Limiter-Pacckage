import express from 'express';
import { rateLimit } from '../src/index';
// @ts-ignore
import RedisMock from 'ioredis-mock';

const app = express();
const mockRedis = new RedisMock();

app.use(express.json());

// Set up rate limit: 2 requests per 1000ms window
app.use(
  '/api',
  rateLimit({
    redis: mockRedis as any, // Mock instance
    window: 1000,
    limit: 2,
    feature: 'test_feature'
  })
);

app.get('/api/data', (req, res) => {
  res.json({ message: 'Success' });
});

const PORT = 3000;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);
  
  try {
    console.log("Making request 1 (should be 200)...");
    const res1 = await fetch(`http://localhost:${PORT}/api/data`);
    console.log("Status 1:", res1.status);
    
    console.log("Making request 2 (should be 200)...");
    const res2 = await fetch(`http://localhost:${PORT}/api/data`);
    console.log("Status 2:", res2.status);
    
    console.log("Making request 3 (should be 429)...");
    const res3 = await fetch(`http://localhost:${PORT}/api/data`);
    console.log("Status 3:", res3.status);

    if (res1.status === 200 && res2.status === 200 && res3.status === 429) {
      console.log("✅ Rate limit test passed!");
      server.close();
      process.exit(0);
    } else {
      console.error("❌ Rate limit test failed!");
      server.close();
      process.exit(1);
    }
  } catch (err) {
    console.error("Test error:", err);
    server.close();
    process.exit(1);
  }
});
