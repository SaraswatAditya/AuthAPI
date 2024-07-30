import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv"
import connect from "./Database/conn.js";
import router from "./Routes/userRoutes.js";

dotenv.config();

const app = express();

//middleware
app.use(express.json());
app.use(cors());

app.use(morgan("tiny")); // This middleware logs HTTP requests and errors to the console, using the "tiny" format which includes minimal details about each request

app.disable("x-powered-by"); //This disables the "X-Powered-By" header in the response, which is usually set to "Express" by default. This is done for security purposes,to avoid revealing information about the server technology


const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.status(201).json("Get Request at /");
});

// API routes
app.use("/api", router);


// Start server when there is a valid connection
connect()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server connected to http://localhost:${port}`);
      });
    } catch (error) {
      console.log("Cannot connect to the server");
    }
  })
  .catch((error) => {
    console.log("Invalid database connection...!", error);
  });

export default app;
