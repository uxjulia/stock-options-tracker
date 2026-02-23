module.exports = {
  apps: [
    {
      name: "options",
      script: "bash",
      args: "-c 'npm run build && npm run start'",
    },
  ],
};
