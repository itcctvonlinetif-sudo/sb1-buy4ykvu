import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

registerRoutes(app);

// In development, we don't serve static files here, Vite handles it.
// In production, we serve from the dist/public folder.
if (process.env.NODE_ENV === "production") {
  const publicPath = path.resolve(__dirname, "public");
  app.use(express.static(publicPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

const port = 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
