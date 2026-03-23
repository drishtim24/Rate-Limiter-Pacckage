local key = KEYS[1]

local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3])
local member = ARGV[4]

-- remove expired requests
redis.call("ZREMRANGEBYSCORE", key, "-inf", currentTime - window)

-- count requests in current window
local count = redis.call("ZCARD", key)

-- if limit reached → reject
if count >= limit then
    local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")

    local resetTime = 0
    if #oldest > 0 then
        resetTime = tonumber(oldest[2]) + window
    end

    return {0, count, resetTime}
end

-- allow request → add timestamp
redis.call("ZADD", key, currentTime, member)

-- set TTL slightly larger than window
redis.call("PEXPIRE", key, window + 1000)

return {1, count + 1, 0}