import express from "express";
export const app = express();
import BillHistory from "./routes/billhistory";
import Record from "./routes/record";
import Stock from "./routes/stock";
import bodyParser from "body-parser";
import cors from 'cors'
import User from "./routes/user";
import { verifyWebHook } from "./service/clerkAuth";

app.use(cors({
  origin: ["http://localhost:3001", "https://stock-management-frontend-seven.vercel.app"],

},))
app.post(
  "/api/v1/user/webhooks/clerk",
  bodyParser.raw({ type: "application/json" }),
  verifyWebHook
);
app.use(express.json())

app.use("/api/v1/record", Record);
app.use("/api/v1/billhistory", BillHistory);
app.use("/api/v1/stock", Stock);


app.get("/", (req: express.Request, res: express.Response) => {
  console.log("hello");
  res.send("<h1 style='color:red'> Hello world</h1>");
});

app.listen("3000", () => {
  console.log("server is running ");
});

export default app; // ✅ must export default
