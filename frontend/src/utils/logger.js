const isDev = import.meta.env.DEV;

const logger = {
    log: (...args) => {
        if (isDev) {
            console.log(...args);
        }
    },
    error: (...args) => {
        if (isDev) {
            console.error(...args);
        }
    },
};

export default logger;
