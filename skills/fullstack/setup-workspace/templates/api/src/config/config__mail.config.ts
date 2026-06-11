export default () => ({
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM,
    consoleUrl:
      process.env.MAIL_CONSOLE_URL ??
      process.env.CONSOLE_URL ??
      'http://localhost:5173',
    supportEmail: process.env.MAIL_SUPPORT_EMAIL,
  },
});
