const logger = require("./logger.js");

process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    logger.error(`Uncaught Exception: ${errorMsg}`);
    console.error(err);
    process.exit(1);
});

process.on("unhandledRejection", err => {
    logger.error(`Unhandled rejection: ${err}`);
    console.error(err);
});