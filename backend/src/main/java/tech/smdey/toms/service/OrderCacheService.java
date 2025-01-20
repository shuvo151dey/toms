package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.TradeOrder;

import java.util.Optional;

@Service
public class OrderCacheService {

    private static final String CACHE_KEY = "orders";

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
}
