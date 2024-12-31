import express from "express"
import authRoutes from "./routes/auth.routes.js"
const app = express()
app.use(express.json())
import connectDb from "./lib/database.config.js"
const port = 80

app.use("/api/auth",authRoutes)
connectDb().then(() => {
    app.listen(port, () => {    
        console.log(`Server is running on port http://localhost:${port}`)
    })
}).catch((error) => {
    console.log("Error connecting to MongoDB: ", error)
    process.exit(1)
})

