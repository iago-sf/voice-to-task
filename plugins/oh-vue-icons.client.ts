import { OhVueIcon, addIcons } from 'oh-vue-icons'
import {
  AiHal,
  BiRobot,
  MdSaveOutlined,
  MdDeleteoutlineOutlined,
  RiLightbulbFlashLine,
  MdAutorenewRound,
  BiChevronDown,
  BiCheck,
} from 'oh-vue-icons/icons'

addIcons(
  AiHal,
  BiRobot,
  MdSaveOutlined,
  MdDeleteoutlineOutlined,
  RiLightbulbFlashLine,
  MdAutorenewRound,
  BiChevronDown,
  BiCheck,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VIcon', OhVueIcon)
})
