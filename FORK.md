# Fork de Tormius

Este repositorio es un fork personal de [pingdotgg/t3code](https://github.com/pingdotgg/t3code).
`main` = t3code oficial + las funciones de esta lista. Las actualizaciones de t3code se traen
fusionando `upstream/main`, nunca reescribiendo historia.

## Mantenerlo al día

```bash
scripts/fork/sync-upstream.sh            # trae t3code, instala dependencias y pasa los checks
scripts/fork/sync-upstream.sh --install  # además reconstruye e instala la app de Mac
scripts/fork/check.sh                    # solo los checks que protegen las funciones del fork
scripts/fork/install-app.sh              # solo reconstruir e instalar la app
git push origin main                     # guardar en github.com/atormo/t3code
```

Si `sync-upstream.sh` para por conflictos, resuélvelos usando la tabla de abajo, haz commit
y vuelve a ejecutarlo. La regla al resolver: conservar el cambio de t3code y volver a aplicar
encima nuestra parte, que siempre es pequeña.

La app instalada no tiene canal de actualización: una versión oficial de T3 Code nunca la
sobrescribe. Se actualiza solo con `install-app.sh`.

## Reglas para cambios nuevos

- Código nuevo del fork en `apps/web/src/fork/` (web), `apps/server/src/notes/` (servidor) y
  archivos nuevos con nombre propio. Tocar archivos de t3code solo para engancharlo.
- Cada enganche en un archivo de t3code, lo más corto posible y anotado en la tabla.
- Cada función con un test que falle si una actualización la rompe, y añadido a `check.sh`.

## Funciones y dónde tocan t3code

| Función                                                                                                                    | Código propio                                                                                          | Enganches en archivos de t3code                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carpetas, espacios (pestañas), Parked y arrastrar proyectos en la barra lateral (modo «Boring sidebar»)                    | `fork/sidebar/*`, `sidebar/SidebarProjectGroupHeader.tsx`, `sidebar/SidebarProjectGroupNameDialog.tsx` | `uiStateStore.ts` (estado `sidebarProjectGroups` con `spaceId`), `Sidebar.tsx` (menús, render, pestañas, filtro por espacio, drop de carpetas de Finder), `Sidebar.logic.ts` (`sectionProjectFoldersByUserGroup`), `sidebar/SidebarProjectFolderHeader.tsx` (`dragProps`) |
| Visor de archivos: el archivo ocupa todo el panel; la pestaña Files se queda al lado y al cerrar un archivo vuelves a ella | —                                                                                                      | `files/FilePreviewPanel.tsx` (árbol plegado al abrir), `rightPanelStore.ts` (`openFile` no quita Files, `closeSurface` vuelve a Files)                                                                                                                                    |
| «New thread» de arriba empieza sin proyecto (Shift+clic: en el proyecto actual)                                            | —                                                                                                      | `Sidebar.tsx` (`handleNewThreadClick`)                                                                                                                                                                                                                                    |
| Barra inferior                                                                                                             | `fork/statusbar/*`                                                                                     | `AppSidebarLayout.tsx` (monta `AppStatusBar` y reserva su altura)                                                                                                                                                                                                         |
| Límites de uso por proveedor en la barra                                                                                   | `fork/statusbar/UsageLimitsItem.tsx`                                                                   | ninguno (usa los límites del proveedor)                                                                                                                                                                                                                                   |
| Límites como % gastado                                                                                                     | —                                                                                                      | `usage/UsageLimits.tsx`, `usage/UsageLimitsPooled.tsx`, `chat/ThreadDetailsUsage.tsx`                                                                                                                                                                                     |
| Keep awake                                                                                                                 | `fork/statusbar/KeepAwake.tsx`, `desktop/src/ipc/methods/keepAwake.ts`                                 | `desktop/src/ipc/channels.ts`, `DesktopIpcHandlers.ts`, `preload.ts`, `contracts/src/ipc.ts` (`setKeepAwake`), `contracts/src/settings.ts` (`keepAwakeWhileAgentsWork`), `LabsSettingsPanel.tsx`, `settingsSearch.ts`                                                     |
| Vista terminal de los hilos (Apariencia → «Terminal-style threads»)                                                        | `fork/chatview/*`                                                                                      | `contracts/src/settings.ts` (`terminalThreadView`), `settings/AppearanceSettingsPanel.tsx`, `settings/settingsSearch.ts`; el CSS se apoya en los `data-*` de las filas del timeline (`data-message-role`, `data-timeline-row-kind`)                                       |
| `/clear` abre un hilo nuevo en el mismo proyecto                                                                           | `fork/chat/clearCommand.ts`                                                                            | `chat/useComposerSend.ts` (intercepta `/clear` antes de enviar)                                                                                                                                                                                                           |
| Notas con pestañas (Markdown en `userdata/notes/`)                                                                         | `fork/notes/*`, `server/src/notes/*`, `contracts/src/notes.ts`                                         | `contracts/src/rpc.ts` e `index.ts` (RPC `notes.*`), `server/src/ws.ts`, `server.ts`, `ws.test.ts`, `auth/RpcAuthorization.ts`, `observability/RpcInstrumentation.ts`, `client-runtime/src/state/server.ts`, `apps/web/package.json` (`@tiptap/markdown`)                 |

## Datos

- Carpetas y su estado plegado: `localStorage` de la app (clave `t3code:ui-state:v1`).
- Espacios (pestañas): `localStorage` (clave `t3code:fork-sidebar-spaces:v1`).
- Notas: `~/.t3/userdata/notes/` (`index.json` + un `.md` por pestaña).
- Desarrollo: `vp run dev:desktop --home-dir .t3` usa `./.t3`, nunca los datos reales.
