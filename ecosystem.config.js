module.exports = {
  apps: [
    {
      name: "resumetailor",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/resumetailor",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
      error_file: "/var/log/pm2/resumetailor-error.log",
      out_file: "/var/log/pm2/resumetailor-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      kill_timeout: 30000,
      wait_ready: false,
      listen_timeout: 10000,
    },
  ],
};
