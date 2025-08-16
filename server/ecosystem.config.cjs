module.exports = {
  apps: [
    {
      name: 'stcet-secrets-share',
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
