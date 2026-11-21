import { httpServer } from "./io";
import { PORT } from "./config";
import { wireHandlers } from "./setup";

wireHandlers();
httpServer.listen(PORT, () => console.log(`server on :${PORT}`));