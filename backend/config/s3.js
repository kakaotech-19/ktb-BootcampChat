const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

class S3Manager {
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  // async uploadFile(key, fileBuffer) {
  //   try {
  //     const upload = new Upload({
  //       client: this.client,
  //       params: {
  //         Bucket: this.bucketName,
  //         Key: key,
  //         Body: fileBuffer,
  //       },
  //     });

  //     await upload.done();
  //     return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  //   } catch (error) {
  //     console.error("S3 업로드 실패:", error);
  //     throw error;
  //   }
  // }

  async uploadFile(key, fileBuffer) {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer, // stream 대신 직접 버퍼 사용
        })
      );
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error("S3 업로드 실패:", error);
      throw error;
    }
  }

  async deleteFile(key) {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      console.error("S3 삭제 실패:", error);
      throw error;
    }
  }
}

module.exports = new S3Manager();
