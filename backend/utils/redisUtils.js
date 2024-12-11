const redisClient = require("./redisClient");

const REDIS_KEYS = {
  CONNECTED_USER: "socket:connected:",
  STREAMING_SESSION: "socket:streaming:",
  USER_ROOM: "socket:user-room:",
  MESSAGE_QUEUE: "socket:msg-queue:",
  MESSAGE_RETRIES: "socket:msg-retries:",
};

class RedisUtils {
  // Helper 메서드들
  static safeStringify(data) {
    try {
      if (typeof data === "string") return data;
      return JSON.stringify(data);
    } catch (error) {
      console.error("JSON stringify error:", error);
      return "";
    }
  }

  static safeParse(data) {
    try {
      if (!data) return null;
      if (typeof data === "object") return data;
      return JSON.parse(data);
    } catch (error) {
      console.error("JSON parse error:", error);
      return null;
    }
  }

  // Connected Users - 단순 문자열이므로 직렬화 불필요
  static async getConnectedSocket(userId) {
    return await redisClient.get(`${REDIS_KEYS.CONNECTED_USER}${userId}`);
  }

  static async setConnectedSocket(userId, socketId, ttl = 86400) {
    return await redisClient.set(
      `${REDIS_KEYS.CONNECTED_USER}${userId}`,
      socketId,
      { ttl }
    );
  }

  static async removeConnectedSocket(userId) {
    return await redisClient.del(`${REDIS_KEYS.CONNECTED_USER}${userId}`);
  }

  // Streaming Sessions - 객체 저장이므로 직렬화 필요
  static async getStreamingSession(messageId) {
    const data = await redisClient.get(
      `${REDIS_KEYS.STREAMING_SESSION}${messageId}`
    );
    return this.safeParse(data);
  }

  static async setStreamingSession(messageId, session, ttl = 3600) {
    const jsonString = this.safeStringify(session);
    if (!jsonString) return false;

    return await redisClient.set(
      `${REDIS_KEYS.STREAMING_SESSION}${messageId}`,
      jsonString,
      { ttl }
    );
  }

  static async removeStreamingSession(messageId) {
    return await redisClient.del(`${REDIS_KEYS.STREAMING_SESSION}${messageId}`);
  }

  // User Rooms - 단순 문자열이므로 직렬화 불필요
  static async getUserRoom(userId) {
    return await redisClient.get(`${REDIS_KEYS.USER_ROOM}${userId}`);
  }

  static async setUserRoom(userId, roomId, ttl = 86400) {
    return await redisClient.set(`${REDIS_KEYS.USER_ROOM}${userId}`, roomId, {
      ttl,
    });
  }

  static async removeUserRoom(userId) {
    return await redisClient.del(`${REDIS_KEYS.USER_ROOM}${userId}`);
  }

  // Message Queue - 객체가 들어올 수 있으므로 직렬화 필요
  static async getMessageQueue(queueKey) {
    const data = await redisClient.get(
      `${REDIS_KEYS.MESSAGE_QUEUE}${queueKey}`
    );
    return this.safeParse(data);
  }

  static async setMessageQueue(queueKey, value, ttl = 300) {
    const jsonString = this.safeStringify(value);
    if (!jsonString) return false;

    return await redisClient.set(
      `${REDIS_KEYS.MESSAGE_QUEUE}${queueKey}`,
      jsonString,
      { ttl }
    );
  }

  static async removeMessageQueue(queueKey) {
    return await redisClient.del(`${REDIS_KEYS.MESSAGE_QUEUE}${queueKey}`);
  }

  // Get Message Queue Keys
  static async getMessageQueueKeys() {
    const pattern = `${REDIS_KEYS.MESSAGE_QUEUE}*`;
    try {
      const keys = await redisClient.client.keys(pattern);
      return keys;
    } catch (error) {
      console.error("Error getting message queue keys:", error);
      return [];
    }
  }

  // Message Retries - 숫자 처리
  static async getMessageRetries(retryKey) {
    const retries = await redisClient.get(
      `${REDIS_KEYS.MESSAGE_RETRIES}${retryKey}`
    );
    return retries ? parseInt(retries) : 0;
  }

  static async incrementMessageRetries(retryKey, ttl = 300) {
    const retries = await redisClient.get(
      `${REDIS_KEYS.MESSAGE_RETRIES}${retryKey}`
    );
    const newValue = (parseInt(retries) || 0) + 1;
    await redisClient.set(
      `${REDIS_KEYS.MESSAGE_RETRIES}${retryKey}`,
      newValue.toString(),
      { ttl }
    );
    return newValue;
  }

  static async removeMessageRetries(retryKey) {
    return await redisClient.del(`${REDIS_KEYS.MESSAGE_RETRIES}${retryKey}`);
  }

  // Streaming Sessions by Room - 객체 배열 처리
  static async getAllStreamingSessions(roomId) {
    const pattern = `${REDIS_KEYS.STREAMING_SESSION}*`;
    try {
      const result = await redisClient.client.keys(pattern);
      const sessions = [];

      for (const key of result) {
        const data = await redisClient.get(key);
        const session = this.safeParse(data);
        if (session && session.room === roomId) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error("Error getting streaming sessions:", error);
      return [];
    }
  }

  // Clear User Data
  static async clearUserData(userId) {
    const patterns = [
      `${REDIS_KEYS.CONNECTED_USER}${userId}`,
      `${REDIS_KEYS.USER_ROOM}${userId}`,
      `${REDIS_KEYS.MESSAGE_QUEUE}*:${userId}`,
      `${REDIS_KEYS.MESSAGE_RETRIES}*:${userId}`,
    ];

    try {
      for (const pattern of patterns) {
        const keys = await redisClient.client.keys(pattern);
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => redisClient.del(key)));
        }
      }
    } catch (error) {
      console.error("Error clearing user data:", error);
      throw error;
    }
  }
}

module.exports = { RedisUtils, REDIS_KEYS };
