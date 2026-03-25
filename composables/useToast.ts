import type { Toast } from '~/types'

let nextId = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function add(toast: Omit<Toast, 'id'>) {
    const id = nextId++
    const duration = toast.duration ?? 5000
    toasts.value.push({ ...toast, id })

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function success(message: string, link?: Toast['link']) {
    return add({ type: 'success', message, link })
  }

  function error(message: string) {
    return add({ type: 'error', message, duration: 8000 })
  }

  function info(message: string) {
    return add({ type: 'info', message })
  }

  return { toasts, add, remove, success, error, info }
}
