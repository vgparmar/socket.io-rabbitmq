import { Server } from "socket.io";
import { connect } from "amqplib";

const io = new Server({});

let connection = null;
let channel = null;
let exchange = null;
try {
  connection = await connect("amqp://localhost");
  channel = await connection.createChannel();
  exchange = await channel.assertExchange("myExchange", "direct", {
    durable: false,
  });

  await channel.assertQueue("disruptions");
  await channel.bindQueue("disruptions", "myExchange", "myBindKey");
} catch (error) {
  console.log("error while connecting to RabbitMQ server", error);
}
io.on("connection", async (socket) => {
  console.log("someone has connected!");

  try {
    channel?.consume("disruptions", (msg) => {
      if (msg !== null) {
        const message = msg.content.toString();
        console.log("Received message: ", message);
        io.emit("disruption", message);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.log("error consuming messages from queue", error);
  }

  socket.on("disconnect", () => {
    console.log("someone has left");
  });
});

io.listen(5000);
