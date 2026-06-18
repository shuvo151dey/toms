package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.TradeOrder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class OrderCacheService {

    private static final String CACHE_KEY = "orders";

    private static final String IDEMPOTENCY_PREFIX = "Idempotency:";

    private static final String LOCK_PREFIX = "order:lock:";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public void saveToCache(Long id, TradeOrder order) {
        redisTemplate.opsForHash().put(CACHE_KEY, id.toString(), order);
    }

    public Optional<TradeOrder> getFromCache(Long id) {
        Object cachedOrder = redisTemplate.opsForHash().get(CACHE_KEY, id.toString());
        return Optional.ofNullable((TradeOrder) cachedOrder);
    }

    public void deleteFromCache(Long id) {
        redisTemplate.opsForHash().delete(CACHE_KEY, id.toString());
    }

    public Optional<TradeOrder> getIdempotentResponse(String key) {
        Object cached = redisTemplate.opsForValue().get(IDEMPOTENCY_PREFIX + key);
        return Optional.ofNullable((TradeOrder) cached);
    }

    public void saveIdempotentResponse(String key, TradeOrder order) {
        redisTemplate.opsForValue().set(IDEMPOTENCY_PREFIX + key, order, 24, TimeUnit.HOURS);
    }

    public Optional<TradeOrder> getOrLoad(Long id, Supplier<Optional<TradeOrder>> dbLoader) {
        Object cached = redisTemplate.opsForHash().get(CACHE_KEY, id.toString());
        if (cached != null) {
            return Optional.of((TradeOrder) cached);
        }
        String lockKey = LOCK_PREFIX + id;
        try {
            redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
            cached = redisTemplate.opsForHash().get(CACHE_KEY, id.toString());
            if (cached != null) {
                return Optional.of((TradeOrder) cached);
            }
            Optional<TradeOrder> order = dbLoader.get();
            order.ifPresent(o -> saveToCache(id, o));
            return order;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    public void invalidate(Long id) {
        String lockKey = LOCK_PREFIX + id;
        try {
            redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
            redisTemplate.opsForHash().delete(CACHE_KEY, id.toString());
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

}
