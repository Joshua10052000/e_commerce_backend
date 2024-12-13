import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import db from "./db.js";

const sessionStore = new PrismaSessionStore(db, { checkPeriod: 604800000 });

export default sessionStore;
