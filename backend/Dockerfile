# 1. Node.js LTS 버전의 경량 이미지를 사용합니다.
FROM node:18-alpine

# 2. 작업 디렉토리를 설정합니다.
WORKDIR /app

# 3. package.json과 package-lock.json을 복사합니다.
COPY package.json package-lock.json ./

# 4. 필요한 패키지를 설치합니다.
RUN npm install --legacy-peer-deps

# 5. 애플리케이션 소스 코드를 복사합니다.
COPY . .

# 6. 환경 변수 파일을 복사하거나 환경 변수를 설정합니다.
# (배포 시 환경 변수는 외부에서 설정하는 것을 권장)
COPY .env .env

# 7. 정적 파일 경로 생성 (필요시)
RUN mkdir -p uploads

# 8. 애플리케이션 포트를 노출합니다.
EXPOSE 5001

# 9. 애플리케이션을 실행합니다.
CMD ["npm", "start"]
