Verificá el estado del último deploy en Vercel para el proyecto GÜIDO CAPUZZI.

Usá las herramientas MCP de Vercel para:

1. **Último deployment**: Usá `list_deployments` para obtener el deployment más reciente. Mostrá:
   - Estado (ready, building, error, etc.)
   - URL del deploy
   - Branch y commit
   - Fecha/hora
   - Duración del build

2. **Si hay error**: Usá `get_deployment_build_logs` para obtener los últimos logs de build y mostrá las líneas relevantes del error.

3. **Health check**: Si el deploy está ready, hacé un fetch a la URL del deploy + `/api/health` para verificar que la API responde correctamente.

Mostrá un resumen conciso con el estado general: ✅ Deploy OK o ❌ Deploy con problemas.
