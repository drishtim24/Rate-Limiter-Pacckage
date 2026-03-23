// import express from "express"
// import Redis from "ioredis"
// import { rateLimit } from "../../dist"

// const app = express()

// const redis = new Redis()

// app.use(rateLimit({
//   redis,
//   feature: "api",
//   limit: 5,
//   window: 10000
// }))

// app.get("/", (req,res)=>{
//   res.send("hello")
// })

// app.listen(3000, ()=>{
//   console.log("server running")
// })
import express from "express"
// Import the mock instead of the real Redis
// @ts-ignore
import RedisMock from "ioredis-mock"
import { rateLimit } from "../../dist"

const app = express()

// Use the mock instance
const redis = new RedisMock()

app.use(rateLimit({
  redis: redis as any, // Cast it if needed
  feature: "api",
  limit: 5,
  window: 10000
}))

app.get("/", (req,res)=>{
  res.send("hello from mocked redis!")
})

app.listen(3000, ()=>{
  console.log("server running with mocked Redis")
})
