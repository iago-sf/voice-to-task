<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
    <div class="max-w-2xl mx-auto flex items-center justify-around sm:justify-center sm:gap-8 h-14">
      <NuxtLink
        to="/"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>Grabar</span>
      </NuxtLink>
      <NuxtLink
        to="/history"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/history' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Historial</span>
      </NuxtLink>
      <NuxtLink
        to="/config"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors"
        :class="$route.path === '/config' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Config</span>
      </NuxtLink>
    </div>
  </nav>
</template>
