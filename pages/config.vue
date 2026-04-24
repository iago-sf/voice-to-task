<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">{{ t('config.title') }}</h1>

    <!-- Monthly usage bar -->
    <div v-if="usage && !isDesktopMode" class="mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('config.monthlyUsage') }}</span>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ usage.used }} / {{ usage.limit }}</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          class="h-2.5 rounded-full transition-all"
          :class="usageBarColor"
          :style="{ width: usagePercent + '%' }"
        />
      </div>
      <p
        v-if="usage.used >= usage.limit"
        class="mt-2 text-xs text-red-600 dark:text-red-400"
      >
        {{ t('config.usageLimitReached') }}
      </p>
      <p
        v-else-if="usage.limit - usage.used <= 10"
        class="mt-2 text-xs text-amber-600 dark:text-amber-400"
      >
        {{ t('config.usageWarning', { remaining: String(usage.limit - usage.used) }) }}
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap"
        :class="activeTab === tab.value
          ? 'text-accent-600 dark:text-accent-400'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = tab.value as TabValue"
      >
        {{ tab.label }}
        <div
          v-if="activeTab === tab.value"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600 dark:bg-accent-400"
        />
      </button>
    </div>

    <!-- ═══════ API KEYS TAB ═══════ -->
    <div v-if="activeTab === 'keys'">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ t('config.apiKeysDesc') }}</p>

      <div class="space-y-4">
        <div
          v-for="keyDef in apiKeyDefs"
          :key="keyDef.name"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ keyDef.label }}</label>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="keyStatus[keyDef.name]
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'"
            >
              {{ keyStatus[keyDef.name] ? t('config.keyConfigured') : t('config.keyNotSet') }}
            </span>
          </div>

          <div class="flex gap-2">
            <input
              v-model="keyInputs[keyDef.name]"
              type="text"
              autocomplete="off"
              data-1p-ignore
              data-lpignore="true"
              class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 placeholder-gray-400 dark:placeholder-gray-600 input-mask"
              :placeholder="t('config.keyPlaceholder')"
            />
            <button
              class="px-3 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              :disabled="!keyInputs[keyDef.name] || savingKey === keyDef.name"
              @click="saveKey(keyDef.name)"
            >
              {{ t('config.keySave') }}
            </button>
            <button
              v-if="keyStatus[keyDef.name]"
              class="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
              :disabled="savingKey === keyDef.name"
              @click="clearKey(keyDef.name)"
            >
              {{ t('config.keyClear') }}
            </button>
          </div>

          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ keyDef.hint }}
            <a v-if="keyDef.url" :href="keyDef.url" target="_blank" rel="noopener" class="text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 underline">{{ keyDef.urlLabel }}</a>
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════ LINEAR TAB ═══════ -->
    <div v-if="activeTab === 'linear'">
      <div class="space-y-4">
        <!-- Current user -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-1">{{ t('config.currentUser') }}</label>
          <div v-if="loadingUser" class="text-sm text-gray-500">{{ t('config.loading') }}</div>
          <div v-else-if="linearUser" class="text-sm text-gray-800 dark:text-gray-200">
            {{ linearUser.name }} <span class="text-gray-500">({{ linearUser.email }})</span>
          </div>
          <div v-else class="text-sm text-red-500 dark:text-red-400">
            {{ t('config.noConnect') }}
          </div>
        </div>

        <!-- Team select -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.team') }}</label>
          <div v-if="loadingTeams" class="text-sm text-gray-500">{{ t('config.loadingTeams') }}</div>
          <select
            v-else-if="teams.length"
            v-model="selectedTeamId"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500"
            @change="onTeamChange"
          >
            <option value="" disabled>{{ t('config.selectTeam') }}</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.key }})
            </option>
          </select>
          <div v-else class="text-sm text-gray-500">{{ t('config.noTeams') }}</div>
        </div>

        <!-- Test connection -->
        <button
          class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
          :disabled="testing"
          @click="testConnection"
        >
          <svg v-if="!testing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ testing ? t('config.testing') : t('config.testConnection') }}
        </button>

        <!-- Linear state mapping -->
        <div class="pt-4">
          <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{{ t('config.linearStateMap') }}</h3>
          <p class="text-xs text-gray-500 mb-3">{{ t('config.linearStateMapDesc') }}</p>

          <div class="space-y-3">
            <div
              v-for="status in taskStatuses"
              :key="status"
              class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <span class="text-sm text-gray-800 dark:text-gray-200 font-medium min-w-[110px]">{{ t(`taskStatus.${status}`) }}</span>
              <select
                :value="config.linearStateMap[status]"
                class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500"
                @change="onStateMapChange(status, ($event.target as HTMLSelectElement).value as LinearStateType)"
              >
                <option v-for="st in linearStateTypes" :key="st" :value="st">
                  {{ t(`linearState.${st}`) }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Status summary -->
      <div v-if="isConfigured" class="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200 text-sm flex items-center gap-2">
        <span>&#10003;</span>
        {{ t('config.configured') }}: {{ config.teamName }} / {{ config.assigneeName }}

      </div>
    </div>

    <!-- ═══════ AI MODELS TAB ═══════ -->
    <div v-if="activeTab === 'ai'">
      <div class="space-y-4">
        <!-- ── Transcription engine ── -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.sttEngine') }}</label>
          <div class="flex gap-3">
            <button
              v-for="engine in sttEngines"
              :key="engine.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-left transition-colors"
              :class="config.sttEngine === engine.value
                ? 'bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-700 text-accent-700 dark:text-accent-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.sttEngine = engine.value; saveConfig()"
            >
              <div class="font-medium mb-0.5">{{ engine.label }}</div>
              <div class="text-xs opacity-70">{{ engine.description }}</div>
            </button>
          </div>
        </div>

        <!-- API key needed for STT -->
        <div
          v-if="config.sttEngine === 'groq' && !keyStatus.groq_api_key"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400"
        >
          {{ t('config.needKey') }}
          <button class="underline ml-1" @click="activeTab = 'keys'">API Keys</button>
        </div>

        <!-- ── Text generation engine ── -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.llmEngine') }}</label>
          <p class="text-xs text-gray-400 dark:text-gray-600 mb-3">{{ t('config.llmEngineDesc') }}</p>
          <div class="flex gap-3">
            <button
              v-for="engine in llmEngines"
              :key="engine.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-left transition-colors"
              :class="config.llmEngine === engine.value
                ? 'bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-700 text-accent-700 dark:text-accent-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.llmEngine = engine.value; saveConfig()"
            >
              <div class="font-medium mb-0.5">{{ engine.label }}</div>
              <div class="text-xs opacity-70">{{ engine.description }}</div>
            </button>
          </div>
        </div>

        <!-- API key needed for LLM -->
        <div
          v-if="config.llmEngine === 'groq' && !keyStatus.groq_api_key"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400"
        >
          {{ t('config.needKey') }}
          <button class="underline ml-1" @click="activeTab = 'keys'">API Keys</button>
        </div>
        <div
          v-if="config.llmEngine === 'zai' && !keyStatus.zai_api_key"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400"
        >
          {{ t('config.needKey') }}
          <button class="underline ml-1" @click="activeTab = 'keys'">API Keys</button>
        </div>
        <div
          v-if="config.llmEngine === 'minimax' && !keyStatus.minimax_api_key"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400"
        >
          {{ t('config.needKey') }}
          <button class="underline ml-1" @click="activeTab = 'keys'">API Keys</button>
        </div>

        <!-- Groq LLM model -->
        <div v-if="config.llmEngine === 'groq'" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.llmModel') }}</label>
          <input
            v-model="config.groqModel"
            type="text"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('config.llmModelPlaceholder')"
            @change="saveConfig"
          />
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ t('config.llmModelHint') }}
            <a href="https://console.groq.com/docs/models" target="_blank" rel="noopener" class="text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 underline">console.groq.com/docs/models</a>.
          </p>
        </div>

        <!-- ZAI LLM model -->
        <div v-if="config.llmEngine === 'zai'" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.zaiLlmModel') }}</label>
          <input
            v-model="config.zaiModel"
            type="text"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('config.zaiModelPlaceholder')"
            @change="saveConfig"
          />
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ t('config.zaiModelHint') }}
          </p>
        </div>

        <!-- MiniMax LLM model -->
        <div v-if="config.llmEngine === 'minimax'" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.minimaxLlmModel') }}</label>
          <input
            v-model="config.minimaxModel"
            type="text"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('config.minimaxModelPlaceholder')"
            @change="saveConfig"
          />
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">
            {{ t('config.minimaxModelHint') }}
            <a href="https://platform.minimax.io/docs/api-reference/text-post" target="_blank" rel="noopener" class="text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 underline">platform.minimax.io</a>.
          </p>
        </div>

        <!-- Language -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.language') }}</label>
          <select
            v-model="config.language"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500"
            @change="saveConfig"
          >
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.label }}
            </option>
          </select>
        </div>

        <!-- Custom prompt -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs text-gray-500">{{ t('config.customPrompt') }}</label>
            <button
              class="text-xs text-accent-500 hover:text-accent-600 dark:text-accent-400 dark:hover:text-accent-300 transition-colors"
              @click="resolvedCustomPrompt = defaultPrompt; saveConfig(); toastSuccess(t('config.customPromptSaved'))"
            >
              {{ t('config.customPromptReset') }}
            </button>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-600 mb-2">{{ t('config.customPromptDesc') }}</p>
          <textarea
            v-model="resolvedCustomPrompt"
            rows="10"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 resize-y font-mono leading-relaxed"
            @blur="saveConfig(); if (resolvedCustomPrompt) toastSuccess(t('config.customPromptSaved'))"
          />
        </div>
      </div>
    </div>


    <!-- ═══════ TERMINAL TAB ═══════ -->
    <div v-if="activeTab === 'terminal'">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Configure a CLI agent to execute plans directly in your terminal.</p>

      <!-- Agent selector -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent</label>
      <select v-model="config.terminalAgent" class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 mb-4" @change="saveConfig()">
        <option value="">Not configured</option>
        <option value="opencode">OpenCode</option>
        <option value="claude-code">Claude Code</option>
      </select>

      <!-- Binary path -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Binary path</label>
      <p class="text-xs text-gray-400 mb-1">Full path to the agent binary. Leave empty to use default (claude / opencode from PATH).</p>
      <div class="flex gap-2 mb-4">
        <input v-model="config.terminalPath" type="text" placeholder="/usr/local/bin/opencode" class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 font-mono" @blur="saveConfig()" />
        <button class="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors whitespace-nowrap disabled:opacity-40" :disabled="terminalTesting || !config.terminalAgent" @click="testTerminal">
          {{ terminalTesting ? 'Testing...' : 'Test' }}
        </button>
      </div>
      <div v-if="terminalTestResult" class="mb-4 text-xs p-2 rounded-lg" :class="terminalTestResult.success ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'">
        {{ terminalTestResult.success ? terminalTestResult.version : terminalTestResult.error }}
      </div>

      <!-- Terminal app -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terminal app</label>
      <select v-model="config.terminalApp" class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 mb-4" @change="saveConfig()">
        <option v-for="app in terminalApps" :key="app.value" :value="app.value">{{ app.label }}</option>
      </select>

      <!-- Project path -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project directory</label>
      <p class="text-xs text-gray-400 mb-1">Working directory for the terminal agent.</p>
      <div class="flex gap-2 mb-4">
        <input v-model="config.projectPath" type="text" placeholder="/path/to/project" class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 font-mono" @blur="saveConfig()" />
        <button class="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors whitespace-nowrap" @click="selectProjectFolder()">
          Browse
        </button>
      </div>
    </div>

    <!-- ═══════ TOKENS TAB ═══════ -->
    <div v-if="activeTab === 'tokens'">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ t('config.apiTokensDesc') }}</p>

      <!-- Generate form -->
      <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
        <label class="block text-xs text-gray-500 mb-2">{{ t('config.tokenName') }}</label>
        <div class="flex gap-2">
          <input
            v-model="tokenName"
            type="text"
            class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500 placeholder-gray-400 dark:placeholder-gray-600"
            :placeholder="t('config.tokenNamePlaceholder')"
            @keyup.enter="generateToken"
          />
          <button
            class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            :disabled="generatingToken"
            @click="generateToken"
          >
            {{ t('config.tokenGenerate') }}
          </button>
        </div>
      </div>

      <!-- Newly created token (shown once) -->
      <div
        v-if="newToken"
        class="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <p class="text-sm text-amber-700 dark:text-amber-400 mb-2">{{ t('config.tokenCreated') }}</p>
        <div class="flex gap-2">
          <code class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 break-all select-all">{{ newToken }}</code>
          <button
            class="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors whitespace-nowrap"
            @click="copyToken"
          >
            {{ tokenCopied ? t('config.tokenCopied') : t('config.tokenCopy') }}
          </button>
        </div>
      </div>

      <!-- Token list -->
      <div v-if="apiTokens.length" class="space-y-2">
        <div
          v-for="tok in apiTokens"
          :key="tok.id"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between gap-4"
        >
          <div class="min-w-0">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ tok.name || '—' }}</div>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ new Date(tok.created_at).toLocaleDateString() }}
              · {{ tok.last_used_at ? new Date(tok.last_used_at).toLocaleDateString() : t('config.tokenNever') }}
            </div>
          </div>
          <button
            class="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm transition-colors whitespace-nowrap"
            @click="revokeToken(tok.id)"
          >
            {{ t('config.tokenRevoke') }}
          </button>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        {{ t('config.tokenEmpty') }}
      </div>
    </div>

    <!-- ═══════ USER CONFIG TAB ═══════ -->
    <div v-if="activeTab === 'user'">
      <div class="space-y-4">
        <!-- Automation -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">

        </div>

        <!-- UI Language -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.uiLanguage') }}</label>
          <div class="flex gap-3">
            <button
              v-for="uiLang in uiLanguages"
              :key="uiLang.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-center transition-colors"
              :class="config.uiLanguage === uiLang.value
                ? 'bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-700 text-accent-700 dark:text-accent-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.uiLanguage = uiLang.value; saveConfig()"
            >
              {{ uiLang.label }}
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.theme') }}</label>
          <div class="flex gap-3">
            <button
              v-for="th in themes"
              :key="th.value"
              class="flex-1 px-3 py-3 rounded-lg border text-sm text-center transition-colors"
              :class="config.theme === th.value
                ? 'bg-accent-50 dark:bg-accent-950 border-accent-400 dark:border-accent-700 text-accent-700 dark:text-accent-200'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'"
              @click="config.theme = th.value; saveConfig(); applyTheme()"
            >
              {{ th.label }}
            </button>
          </div>
        </div>

        <!-- Accent color -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.accentColor') }}</label>
          <div class="flex gap-2">
            <button
              v-for="ac in accentColors"
              :key="ac.value"
              class="w-8 h-8 rounded-full border-2 transition-all"
              :class="config.accentColor === ac.value ? 'border-white dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-700 hover:scale-105'"
              :style="{ backgroundColor: ac.swatch }"
              :title="ac.label"
              @click="config.accentColor = ac.value; saveConfig(); applyAccentColor()"
            >
              <div
                v-if="config.accentColor === ac.value"
                class="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center"
              >
                <svg class="w-2 h-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4 4 4 6-6" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Microphone selector -->
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <label class="block text-xs text-gray-500 mb-2">{{ t('config.microphone') }}</label>
          <select
            v-model="config.audioDeviceId"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-accent-500"
            @change="saveConfig"
          >
            <option value="">{{ t('config.micDefault') }}</option>
            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || device.deviceId }}
            </option>
          </select>
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-600">{{ t('config.micHint') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LinearTeam, LinearUser, TaskStatus, LinearStateType } from '~/types'

const accentColors = [
  { value: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { value: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { value: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { value: 'rose', label: 'Rose', swatch: '#f43f5e' },
  { value: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { value: 'amber', label: 'Amber', swatch: '#f59e0b' },
]

const { config, isConfigured, loadConfig, saveConfig } = useConfig()
const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToast()
const { applyTheme, applyAccentColor } = useTheme()

type TabValue = 'keys' | 'linear' | 'ai' | 'user' | 'terminal' | 'tokens'
const validTabs: TabValue[] = ['keys', 'linear', 'ai', 'user', 'terminal', 'tokens']
const route = useRoute()
const router = useRouter()

const activeTab = ref<TabValue>(
  validTabs.includes(route.query.tab as TabValue) ? (route.query.tab as TabValue) : 'keys'
)

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } })
})

watch(() => route.query.tab, (tab) => {
  if (validTabs.includes(tab as TabValue) && tab !== activeTab.value) {
    activeTab.value = tab as TabValue
  }
})
const audioDevices = ref<MediaDeviceInfo[]>([])

// ── Monthly usage ──
const runtimeConfig = useRuntimeConfig()
const isDesktopMode = computed(() => runtimeConfig.public.desktopMode === true)
const usage = ref<{ used: number; limit: number; month: string } | null>(null)

const usagePercent = computed(() => {
  if (!usage.value) return 0
  return Math.min(100, Math.round((usage.value.used / usage.value.limit) * 100))
})

const usageBarColor = computed(() => {
  const pct = usagePercent.value
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-accent-600'
})

async function loadUsage() {
  try {
    usage.value = await $fetch<{ used: number; limit: number; month: string }>('/api/usage')
  } catch {
    // silently fail
  }
}

async function loadAudioDevices() {
  if (!import.meta.client || !navigator.mediaDevices?.enumerateDevices) return
  try {
    // Request mic permission so enumerateDevices returns labels
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(t => t.stop())
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevices.value = devices.filter(d => d.kind === 'audioinput')
  } catch {
    // permission denied or not available
  }
}

watch(activeTab, (tab) => {
  if (tab === 'user') loadAudioDevices()
  if (tab === 'tokens') loadTokens()
})

const tabs = computed(() => {
  const list: { value: string; label: string }[] = [
    { value: 'keys', label: t('config.apiKeys') },
    { value: 'linear', label: t('config.linear') },
    { value: 'ai', label: t('config.aiModels') },
    { value: 'user', label: t('config.userConfig') },
  ]
  if (isDesktopMode) list.push({ value: 'terminal', label: 'Terminal' })
  list.push({ value: 'tokens', label: t('config.apiTokens') })
  return list
})

const terminalTestResult = ref<{ success: boolean; version?: string; error?: string } | null>(null)
const terminalTesting = ref(false)

async function testTerminal() {
  terminalTesting.value = true
  terminalTestResult.value = null
  try {
    const binary = config.value.terminalPath || (config.value.terminalAgent === 'claude-code' ? 'claude' : 'opencode')
    const electron = (window as any).__electron
    if (electron?.testTerminalBinary) {
      terminalTestResult.value = await electron.testTerminalBinary(binary)
    }
  } catch (err) {
    terminalTestResult.value = { success: false, error: String(err) }
  } finally {
    terminalTesting.value = false
  }
}

const terminalApps = computed(() => {
  const platform = (window as any).__electron?.platform || 'darwin'
  const apps: { value: string; label: string }[] = []
  if (platform === 'darwin') {
    apps.push({ value: 'terminal', label: 'Terminal.app' })
    apps.push({ value: 'iterm', label: 'iTerm2' })
    apps.push({ value: 'warp', label: 'Warp' })
    apps.push({ value: 'ghostty', label: 'Ghostty' })
    apps.push({ value: 'alacritty', label: 'Alacritty' })
    apps.push({ value: 'cmux', label: 'cmux' })
    apps.push({ value: 'tmux', label: 'tmux' })
  } else if (platform === 'win32') {
    apps.push({ value: 'windows-terminal', label: 'Windows Terminal' })
    apps.push({ value: 'cmd', label: 'cmd' })
  } else {
    apps.push({ value: 'gnome-terminal', label: 'GNOME Terminal' })
    apps.push({ value: 'konsole', label: 'Konsole' })
    apps.push({ value: 'tmux', label: 'tmux' })
  }
  return apps
})

// ── API Keys ──
const keyStatus = ref<Record<string, boolean>>({
  linear_api_key: false,
  groq_api_key: false,
  zai_api_key: false,
  minimax_api_key: false,
})
const keyInputs = ref<Record<string, string>>({
  linear_api_key: '',
  groq_api_key: '',
  zai_api_key: '',
  minimax_api_key: '',
})
const savingKey = ref<string | null>(null)

const apiKeyDefs = computed(() => [
  { name: 'linear_api_key', label: t('config.linearApiKey'), hint: t('config.keyHintLinear'), url: 'https://linear.app/settings/api', urlLabel: 'linear.app/settings/api' },
  { name: 'groq_api_key', label: t('config.groqApiKey'), hint: t('config.keyHintGroq'), url: 'https://console.groq.com/keys', urlLabel: 'console.groq.com/keys' },
  { name: 'zai_api_key', label: t('config.zaiApiKey'), hint: t('config.keyHintZai'), url: 'https://z.ai', urlLabel: 'z.ai' },
  { name: 'minimax_api_key', label: t('config.minimaxApiKey'), hint: t('config.keyHintMinimax'), url: 'https://platform.minimax.io', urlLabel: 'platform.minimax.io' },
])

async function loadKeyStatus() {
  try {
    const data = await $fetch<Record<string, boolean>>('/api/user-keys')
    keyStatus.value = data
  } catch {
    // not logged in or error
  }
}

async function saveKey(keyName: string) {
  savingKey.value = keyName
  try {
    await $fetch('/api/user-keys', {
      method: 'PUT',
      body: { [keyName]: keyInputs.value[keyName] },
    })
    keyInputs.value[keyName] = ''
    keyStatus.value[keyName] = true
    toastSuccess(t('config.keySaved'))
  } catch {
    toastError(t('config.keyError'))
  } finally {
    savingKey.value = null
  }
}

async function clearKey(keyName: string) {
  savingKey.value = keyName
  try {
    await $fetch('/api/user-keys', {
      method: 'PUT',
      body: { [keyName]: '' },
    })
    keyStatus.value[keyName] = false
    toastSuccess(t('config.keyCleared'))
  } catch {
    toastError(t('config.keyError'))
  } finally {
    savingKey.value = null
  }
}

// ── API Tokens ──
interface ApiTokenInfo { id: number; name: string; created_at: string; last_used_at: string | null }
const apiTokens = ref<ApiTokenInfo[]>([])
const tokenName = ref('')
const newToken = ref('')
const tokenCopied = ref(false)
const generatingToken = ref(false)

async function loadTokens() {
  try {
    apiTokens.value = await $fetch<ApiTokenInfo[]>('/api/api-tokens')
  } catch { /* not logged in */ }
}

async function generateToken() {
  generatingToken.value = true
  try {
    const res = await $fetch<{ token: string }>('/api/api-tokens', {
      method: 'POST',
      body: { name: tokenName.value },
    })
    newToken.value = res.token
    tokenName.value = ''
    tokenCopied.value = false
    await loadTokens()
  } catch {
    toastError('Error generating token')
  } finally {
    generatingToken.value = false
  }
}

async function copyToken() {
  await navigator.clipboard.writeText(newToken.value)
  tokenCopied.value = true
  toastSuccess(t('config.tokenCopied'))
}

async function revokeToken(id: number) {
  if (!confirm(t('config.tokenRevokeConfirm'))) return
  try {
    await $fetch(`/api/api-tokens/${id}`, { method: 'DELETE' })
    toastSuccess(t('config.tokenRevoked'))
    await loadTokens()
    if (newToken.value) newToken.value = '' // clear if it was the revoked one
  } catch {
    toastError('Error revoking token')
  }
}

// ── Linear ──
const teams = ref<LinearTeam[]>([])
const linearUser = ref<LinearUser | null>(null)
const loadingTeams = ref(true)
const loadingUser = ref(true)
const testing = ref(false)
const selectedTeamId = ref('')

const taskStatuses: TaskStatus[] = ['TRIAGE', 'TODO', 'IN_PROGRESS', 'DONE']
const linearStateTypes: LinearStateType[] = ['triage', 'backlog', 'unstarted', 'started', 'completed', 'canceled']

const themes = computed(() => [
  { value: 'system' as const, label: t('config.themeSystem') },
  { value: 'light' as const, label: t('config.themeLight') },
  { value: 'dark' as const, label: t('config.themeDark') },
])

async function onStateMapChange(status: TaskStatus, stateType: LinearStateType) {
  config.value.linearStateMap[status] = stateType
  saveConfig()
  try {
    await $fetch('/api/settings', {
      method: 'PATCH',
      body: { linearStateMap: JSON.stringify(config.value.linearStateMap) },
    })
  } catch {
    toastError('Error saving state mapping')
  }
}

const sttEngines = computed(() => [
  { value: 'browser' as const, label: t('config.engineBrowser'), description: t('config.engineBrowserDesc') },
  { value: 'groq' as const, label: t('config.engineGroq'), description: t('config.engineGroqDesc') },
])

const llmEngines = computed(() => [
  { value: 'groq' as const, label: t('config.llmGroq'), description: t('config.llmGroqDesc') },
  { value: 'zai' as const, label: t('config.llmZai'), description: t('config.llmZaiDesc') },
  { value: 'minimax' as const, label: t('config.llmMinimax'), description: t('config.llmMinimaxDesc') },
])

const uiLanguages = [
  { value: 'en' as const, label: 'English' },
  { value: 'es' as const, label: 'Español' },
]

const defaultPrompt = `You are a senior task planning assistant. Given a raw task description (often from voice transcription), produce a thorough, actionable plan.

Reply in the same language as the input. Use this exact format:

TITLE: <concise task title, max 100 chars, imperative form>

CONTEXT NEEDED:
List specific questions for the developer if information is missing or ambiguous. Skip if clear.

PLAN:
- [ ] Step 1 — be specific: mention file paths, function names, API endpoints
- [ ] Step 2 — each step should be independently verifiable
...

QUESTIONS:
1-5 concrete questions for the developer, or "None — task is clear."

GENERATED CONTEXT:
Brief context document (2-10 bullet points) summarizing key domain knowledge, patterns, or decisions for reuse in future tasks of the same area.`

const resolvedCustomPrompt = computed({
  get: () => (!config.value.customPrompt || config.value.customPrompt === '__DEFAULT__') ? defaultPrompt : config.value.customPrompt,
  set: (v: string) => { config.value.customPrompt = v || '__DEFAULT__' }
})

const languages = [
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'ca-ES', label: 'Català' },
  { code: 'gl-ES', label: 'Galego' },
  { code: 'eu-ES', label: 'Euskara' },
]

function onTeamChange() {
  const team = teams.value.find(t => t.id === selectedTeamId.value)
  if (team) {
    config.value.teamId = team.id
    config.value.teamName = team.name
    saveConfig()
  }
}

async function testConnection() {
  testing.value = true
  try {
    const me = await $fetch<LinearUser>('/api/linear/me')
    toastSuccess(`${t('config.connectedAs')} ${me.name}`)
  } catch {
    toastError(t('config.connectError'))
  } finally {
    testing.value = false
  }
}

onMounted(async () => {
  loadConfig()
  selectedTeamId.value = config.value.teamId
  loadAudioDevices()
  loadUsage()

  // Load key status
  await loadKeyStatus()

  // Load teams and user in parallel
  const [teamsResult, userResult] = await Promise.allSettled([
    $fetch<LinearTeam[]>('/api/linear/teams'),
    $fetch<LinearUser>('/api/linear/me'),
  ])

  if (teamsResult.status === 'fulfilled') {
    teams.value = teamsResult.value
  }
  loadingTeams.value = false

  if (userResult.status === 'fulfilled') {
    linearUser.value = userResult.value
    config.value.assigneeId = userResult.value.id
    config.value.assigneeName = userResult.value.name
    saveConfig()
  }
  loadingUser.value = false
})
async function selectProjectFolder() {
  const electron = (window as any).__electron
  const p = await electron?.selectFolder?.()
  if (p) { config.value.projectPath = p; saveConfig() }
}
</script>
