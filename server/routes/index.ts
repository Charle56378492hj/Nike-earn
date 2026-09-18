import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import balanceRouter from "./balance";
import transactionsRouter from "./transactions";
import withdrawalsRouter from "./withdrawals";
import platformsRouter from "./platforms";
import adminsRouter from "./admins";
import dashboardRouter from "./dashboard";
import verificationsRouter from "./verifications";
import postbackRouter from "./postback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(balanceRouter);
router.use(transactionsRouter);
router.use(withdrawalsRouter);
router.use(platformsRouter);
router.use(adminsRouter);
router.use(dashboardRouter);
router.use(verificationsRouter);
router.use(postbackRouter);

export default router;
