/**
 * Hook: PostToolUse — TypeScript typecheck en edits a src/
 * No bloquea (siempre exit 0), solo muestra errores como advertencia.
 */
let d = '';
process.stdin.on('data', c => (d += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(d || '{}');
    const fp = (input.tool_input || {}).file_path || '';

    // Solo actuar si es un archivo TypeScript dentro de src/
    if (!/[/\\]src[/\\].*\.tsx?$/.test(fp)) return;

    const { spawnSync } = require('child_process');
    const result = spawnSync('npx', ['tsc', '--noEmit'], {
      encoding: 'utf8',
      timeout: 20000,
      shell: true,
      cwd: process.cwd(),
    });

    const out = ((result.stdout || '') + (result.stderr || '')).trim();
    if (out) {
      const lines = out.split('\n').filter(Boolean).slice(0, 8);
      console.warn('\n⚠️  TypeScript:\n' + lines.join('\n') + '\n');
    }
  } catch (e) {
    // Hook falla silenciosamente — no interrumpir el flujo
  }
});
