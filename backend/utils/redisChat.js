const redisClient = require("./redisClient");

const REDIS_CHAT_KEYS = {
  CHAT_MESSAGES: "chat:messages:",
};

class RedisChat {
  static getMessagesKey(roomId) {
    return `${REDIS_CHAT_KEYS.CHAT_MESSAGES}${roomId}`;
  }

  static async cacheMessages(roomId, messages) {
    try {
      const pipeline = redisClient.client.MULTI(); // .client 제거
      const messagesKey = this.getMessagesKey(roomId);

      for (const message of messages) {
        const timestamp = new Date(message.timestamp).getTime();
        pipeline.ZADD(messagesKey, [
          {
            // ZADD로 변경
            score: timestamp,
            value: JSON.stringify(message),
          },
        ]);
      }

      pipeline.EXPIRE(messagesKey, 86400); // EXPIRE로 변경
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error("Error caching messages:", error);
      return false;
    }
  }

  static async loadCachedMessages(roomId, before = null, limit = 30) {
    try {
      const messagesKey = this.getMessagesKey(roomId);
      const maxScore = before ? new Date(before).getTime() - 1 : "+inf";
      const messages = await redisClient.client.sendCommand([
        "ZRANGE",
        messagesKey,
        String(maxScore),
        "0",
        "BYSCORE",
        "REV",
        "LIMIT",
        "0",
        `${limit}`,
        // "5",
      ]);
      const result = messages.map((value) => JSON.parse(value));
      console.log("result[0].time=" + result[0].timestamp);
      console.log("result[last].time=" + result[result.length - 1].timestamp);
      console.log("Found messages count:", messages?.length);

      if (!messages || messages.length === 0) return null;
      if (messages.length < 30) return null;

      //   console.log("one messages=" + messages);
      return messages.map((msg) => JSON.parse(msg));
    } catch (error) {
      console.error("Error getting cached messages:", error);
      return null;
    }
  }

  static async addNewMessage(roomId, message) {
    try {
      console.log("try save msg in redis start");
      const messagesKey = this.getMessagesKey(roomId);
      const timestamp = new Date(message.timestamp).getTime();

      await redisClient.client.ZADD(messagesKey, [
        {
          // ZADD로 변경
          score: timestamp,
          value: JSON.stringify(message),
        },
      ]);

      console.log("try save msg in redis finish");
      return true;
    } catch (error) {
      console.error("Error adding new message:", error);
      return false;
    }
  }

  static async clearRoomCache(roomId) {
    try {
      const messagesKey = this.getMessagesKey(roomId);
      await redisClient.client.DEL(messagesKey); // .client 제거, DEL로 변경
      return true;
    } catch (error) {
      console.error("Error clearing room cache:", error);
      return false;
    }
  }
}

module.exports = { RedisChat, REDIS_CHAT_KEYS };
