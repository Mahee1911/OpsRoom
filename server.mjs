import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const nextApp = next({
  dev,
  hostname,
  port,
});

const handle = nextApp.getRequestHandler();

await nextApp.prepare();

const httpServer = createServer((req, res) => {
  handle(req, res);
});

const io = new SocketIOServer(httpServer, {
  path: "/api/socket/io",
  addTrailingSlash: false,
});

httpServer.io = io;

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("server:join", (serverId) => {
    if (typeof serverId !== "string" || !serverId) return;

    const roomKey = `server:${serverId}`;
    const refreshKey = `server:${serverId}:refresh`;

    socket.join(roomKey);

    // When someone joins through an invite and opens the server,
    // notify existing members to refresh their member list.
    socket.to(roomKey).emit(refreshKey);
  });

  socket.on("server:leave", (serverId) => {
    if (typeof serverId !== "string" || !serverId) return;

    socket.leave(`server:${serverId}`);
  });

  socket.on("server:refresh", (serverId) => {
    if (typeof serverId !== "string" || !serverId) return;

    const roomKey = `server:${serverId}`;
    const refreshKey = `server:${serverId}:refresh`;

    // Refresh every other browser in this server.
    socket.to(roomKey).emit(refreshKey);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

httpServer.listen(port, hostname, () => {
  console.log(
    `> OpsRoom running at http://localhost:${port}`
  );
});