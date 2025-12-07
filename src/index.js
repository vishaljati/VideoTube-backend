import dotenv from "dotenv";
dotenv.config({
  path: './.env'
})
import { connectDB } from "./db/index.js";
import { app } from "./app.js"



//SENDING DEMO Response
app.get("/", (req, res) => {
  res.send(`<h1>Server is running successfully on ${process.env.PORT}</h1>`);
});

// DB connection & starting server
const port = process.env.PORT||3000
connectDB()
  .then(() => {
     app.listen(port, (err) => {
        if (err) {
          console.error("Error starting server:", err);
        } else {
           console.log(`Server started at http://127.0.0.1:${port}`);
        }

      })
   })
  .catch((error) => {
    console.log("MONGODB Connetion Failed ", error);
  })




