import express from "express"
import Redis from "ioredis"
import { rateLimit } from "../../dist"

const app = express()

const redis = new Redis()

app.use(rateLimit({
  redis,
  feature: "api",
  limit: 5,
  window: 10000
}))

app.get("/", (req,res)=>{
  res.send("hello")
})

app.listen(3000, ()=>{
  console.log("server running")
})