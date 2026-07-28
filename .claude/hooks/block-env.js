/**
 * Hook: PreToolUse — bloquea edits a .env.local
 * Se ejecuta antes de Edit/Write. Exit 2 = bloquear la acción.
 */
let d = '';
process.stdin.on('data', c => (d += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(d || '{}');
    const fp = (input.tool_input || {}).file_path || '';
    if (fp.includes('.env.local')) {
      process.stderr.write(
        '\n🔒 BLOQUEADO: .env.local es de solo lectura.\n' +
        '   Hablá con Naza antes de modificar variables de entorno.\n\n'
      );
      process.exit(2);
    }
  } catch (e) {
    // Si el JSON falla, no bloqueamos
  }
});
