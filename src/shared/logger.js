function write(level, event, details = {}) {
  const record = {
    time: new Date().toISOString(),
    level,
    event,
    ...details,
  };
  const output = JSON.stringify(record);
  if (level === 'error') console.error(output);
  else console.log(output);
}

export const logger = {
  info(event, details) {
    write('info', event, details);
  },
  error(event, details) {
    write('error', event, details);
  },
};
