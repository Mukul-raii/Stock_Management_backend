import express from "express";
const app = express();
import BillHistory from "./routes/billhistory";
import Record from "./routes/record";
import Stock from "./routes/stock";
import bodyParser from "body-parser";


app.use(bodyParser());
app.use("/record", Record);
app.use("/billhistory", BillHistory);
app.use("/stock", Stock);

app.get("/", (req: express.Request, res: express.Response) => {
  console.log("hello");
  res.send("<h1 style='color:red'> Hello world</h1>");
});

app.listen("3000", () => {
  console.log("server is running ");
});
