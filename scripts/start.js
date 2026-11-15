import { spawn } from 'node:child_process';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('\n🚀 Starting StudyMate AI in Production Mode...\n');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const server = spawn(npmCmd, ['--prefix', 'backend', 'start'], {
    stdio: 'inherit',
  });
  process.on('SIGINT', () => {
    server.kill();
    process.exit();
  });
  process.on('SIGTERM', () => {
    server.kill();
    process.exit();
  });
} else {
  console.log('\n🚀 Starting StudyMate AI (Backend + Frontend)...\n');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const backend = spawn(npmCmd, ['--prefix', 'backend', 'run', 'dev'], {
    stdio: 'inherit',
  });

  const frontend = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
    stdio: 'inherit',
  });

  const cleanup = () => {
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
