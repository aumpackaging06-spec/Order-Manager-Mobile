import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import productsRouter from "./products";
import ordersRouter from "./orders";
import quotationsRouter from "./quotations";
import dispatchRouter from "./dispatch";
import paymentsRouter from "./payments";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customersRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(quotationsRouter);
router.use(dispatchRouter);
router.use(paymentsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
