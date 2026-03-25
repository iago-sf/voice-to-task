<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
    <div class="max-w-2xl mx-auto flex items-center justify-around sm:justify-center sm:gap-8 h-14">
      <NuxtLink
        to="/"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>{{ t('nav.record') }}</span>
      </NuxtLink>
      <NuxtLink
        to="/history"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/history' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ t('nav.history') }}</span>
      </NuxtLink>
      <NuxtLink
        to="/contexts"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/contexts' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{{ t('nav.contexts') }}</span>
      </NuxtLink>
      <NuxtLink
        to="/api-docs"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/api-docs' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <span>API</span>
      </NuxtLink>
      <NuxtLink
        to="/config"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/config' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ t('nav.config') }}</span>
      </NuxtLink>
      <button
        v-if="loggedIn && user"
        @click="showUserMenu = !showUserMenu"
        class="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.name"
          class="w-5 h-5 rounded-full"
        />
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="hidden sm:inline truncate max-w-[60px]">{{ user.name?.split(' ')[0] }}</span>
        <div
          v-if="showUserMenu"
          class="absolute bottom-full sm:top-full sm:bottom-auto mb-2 sm:mb-0 sm:mt-2 right-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50"
        >
          <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ user.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.email }}</p>
          </div>
          <button
            @click.stop="logout"
            class="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {{ t('nav.logout') }}
          </button>
        </div>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { loggedIn, user, clear } = useUserSession()
const showUserMenu = ref(false)

async function logout() {
  showUserMenu.value = false
  await clear()
  navigateTo('/login')
}
</script>
