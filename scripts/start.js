import { spawn } from 'node:child_process';

console.log('\n🚀 Starting StudyMate AI (Backend + Frontend)...\n');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['--prefix', 'backend', 'run', 'dev'], {
  stdio: 'inherit'
});

const frontend = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
  stdio: 'inherit'
});

const cleanup = () => {
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
