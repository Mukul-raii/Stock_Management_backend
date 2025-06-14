import express from "express";
const app = express();
import BillHistory from "./routes/billhistory";
import Record from "./routes/record";
import Stock from "./routes/stock";
import cors from "cors";

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://stock-management-frontend-seven.vercel.app",
    ],
  })
);

// Use individual json/urlencoded middlewares instead of deprecated bodyParser()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
