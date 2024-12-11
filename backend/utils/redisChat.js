const redisClient = require("./redisClient");

const REDIS_CHAT_KEYS = {
  CHAT_MESSAGES: "chat:messages:", // Message 객체를 시간순으로 저장하는 sorted set
};

class RedisChat {
  static getMessagesKey(roomId) {
    return `${REDIS_CHAT_KEYS.CHAT_MESSAGES}${roomId}`;
  }

  // 메시지들을 Redis에 캐싱
  static async cacheMessages(roomId, messages) {
    try {
      const pipeline = redisClient.client.multi();
      const messagesKey = this.getMessagesKey(roomId);

      // 각 메시지를 시간순으로 sorted set에 저장
      for (const message of messages) {
        const timestamp = new Date(message.timestamp).getTime();
        pipeline.zadd(messagesKey, timestamp, JSON.stringify(message));
      }

      // 만료시간 설정 (24시간)
      pipeline.expire(messagesKey, 86400);
      await pipeline.exec();

      return true;
    } catch (error) {
      console.error("Error caching messages:", error);
      return false;
    }
  }

  // Redis에서 캐시된 메시지 조회
  static async loadCachedMessages(roomId, before = null, limit = 30) {
    try {
      const messagesKey = this.getMessagesKey(roomId);
      const maxScore = before ? new Date(before).getTime() : "+inf";

      // 시간순으로 메시지 조회
      const messages = await redisClient.client.zrevrangebyscore(
        messagesKey,
        maxScore,
        "-inf",
        "LIMIT",
        0,
        limit
      );

      if (!messages?.length) return null;

      // JSON 문자열을 객체로 변환
      return messages.map((msg) => JSON.parse(msg));
    } catch (error) {
      console.error("Error getting cached messages:", error);
      return null;
    }
  }

  // reids에 새 메시지 추가
  static async addNewMessage(roomId, message) {
    try {
      const messagesKey = this.getMessagesKey(roomId);
      const timestamp = new Date(message.timestamp).getTime();

      // 메시지를 sorted set에 추가
      await redisClient.client.zadd(
        messagesKey,
        timestamp,
        JSON.stringify(message)
      );
      return true;
    } catch (error) {
      console.error("Error adding new message:", error);
      return false;
    }
  }

  // 채팅방 캐시 삭제
  static async clearRoomCache(roomId) {
    try {
      const messagesKey = this.getMessagesKey(roomId);
      await redisClient.client.del(messagesKey);
      return true;
    } catch (error) {
      console.error("Error clearing room cache:", error);
      return false;
    }
  }
}

module.exports = { RedisChat, REDIS_CHAT_KEYS };
