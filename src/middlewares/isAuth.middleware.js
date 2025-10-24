import { verifyToken } from "./auth.middleware.js";

const isAuth = verifyToken;

export { isAuth };