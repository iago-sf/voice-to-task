# Memoria de session — 2026-03-31

## What is changed (2026-03-31)

### Chat UI Redesign
- Rewritten `pages/index.vue` as a chat UI with streaming LLM responses, bottom input bar, right sidebar
- Extracted `components/ChatSidebar.vue` component with props/emits
- Labels, projects, contexts shown as active pills with `+ Add` dropdown for inactive
- Removed `Generate Plan` and `Refine` buttons - now conversational (write to iterate)
- Removed `regeneratePlan`, `submitRefineFromChat`, `refineSTT` functions
- Fixed `handleEnter` to filter by `e.key !== 'Enter'`
- Fixed streaming visibility: `v-html` renders during generation (no `!msg.generating` check)
- Added "Generating..." footer spinner during streaming
- Fixed reactivity: `streamPlan` mutates `messages.value[index]` not the object directly
- Fixed `purifyReady` flag to avoid hydration mismatch with DOMPurify
- History recovery loads text into input (not as chat message)
- Added `pb-16 sm:pb-0 sm:pt-14` padding in `app.vue` for NavBar offset
- Added i18n keys: `index.add`, `index.noneSelected` (EN + ES)

### Architecture
- **Chat UI**: messages in chat (user right, system left), LLM responses below with action buttons. Sidebar shows tags as pills with `+ Add`.
- **SSE Streaming**: `server/utils/llm.ts` has `streamGroq`, `streamZai`, `streamMinimax` with JSON fallback for ZAI
- **Reactivity**: Always mutate via `messages.value[index]`, never pass the message object directly
- **DOMPurify**: Async load with `purifyReady` flag, plain text fallback
- **Multi-line `:class` with ternaries** break the Vue macro parser — keep single-line
- **NavBar**: `h-14`, fixed `bottom-0` mobile, `top-0` desktop. `app.vue` adds `pb-16 sm:pb-0 sm:pt-14` padding

### Known issues (to fix)
- `toggleRecording` reads `transcript.value` directly to avoid race condition with `stop()`/`reset()`
- The `watch(transcript)` only updates `inputText` while `isListening` is true (for real-time display)

### Bug fix: duplicate code blocks in pages/index.vue
- `scrollToBottom`, `toggleRecording`, `watch`, `onMounted` were each defined 2-3 times
- This caused `TS2393: Duplicate function implementation` errors
- Vite compilation crashed with "IPC connection closed" due to these errors
- Fixed by deduplicating all functions, watchers, and lifecycle hooks
- Added null checks (`getMsg()`) in `streamPlan` to satisfy TS strict checks on `messages.value[msgIndex]`
- Added null checks in `runAutoFlow` for `messages.value[autoMsgIndex]` access
- Key lesson: always use `messages.value[index]` via a getter function for reactivity AND null safety
