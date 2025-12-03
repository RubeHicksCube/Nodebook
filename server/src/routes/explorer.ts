import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ explorer: "Here would be explorer data" });
});

export default router;
