# Quiz Game

Game đố vui nhiều người chơi trên web. Client React, server Node.

## Cấu trúc

```
client/   # giao diện React
server/   # Express server, quản lý câu hỏi và luồng chơi
```

Dữ liệu mẫu nằm ở `server/sampleQuestions.json` và `server/teamMembers.json`.

## Chạy

```bash
# server
cd server
npm install
cp .env.example .env
npm start

# client (terminal khác)
cd client
npm install
npm start
```

## Deploy

Có sẵn `render.yaml` để deploy lên Render.
