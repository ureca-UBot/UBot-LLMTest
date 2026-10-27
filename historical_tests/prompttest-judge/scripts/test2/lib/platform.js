'use strict';
// Resolves environment-specific paths so pipeline scripts stay identical on
// Windows (local, low-tier models) and Linux/EC2 (high-tier models). Nothing
// here should need branching anywhere else in the codebase — if a new OS
// difference shows up, it belongs in this file.

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..', '..');
const IS_WINDOWS = process.platform === 'win32';

const VENV_DIR = path.join(ROOT, '.venv_nli');
const VENV_PYTHON = IS_WINDOWS
  ? path.join(VENV_DIR, 'Scripts', 'python.exe')
  : path.join(VENV_DIR, 'bin', 'python');

function resolvePython() {
  if (fs.existsSync(VENV_PYTHON)) return VENV_PYTHON;
  // Fall back to a system python if the venv hasn't been created yet (fails
  // loudly downstream with a clear "module not found" rather than silently
  // using the wrong interpreter).
  return IS_WINDOWS ? 'python' : 'python3';
}

// Environment tag used in run_id / result filenames so local and EC2 runs
// never collide and stay easy to tell apart later.
function envTag() {
  if (process.env.LLM_TEST_ENV) return process.env.LLM_TEST_ENV; // explicit override
  return IS_WINDOWS ? 'local-win' : 'ec2-linux';
}

module.exports = { ROOT, IS_WINDOWS, VENV_DIR, VENV_PYTHON, resolvePython, envTag };
