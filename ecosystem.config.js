module.exports = {
  apps: [
    {
      name: 'nki-server',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
