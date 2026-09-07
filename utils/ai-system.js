// AI 动态调参系统
const { GAME_CONSTANTS, FRUIT_CONFIG } = require('./config.js')

class AISystem {
  constructor() {
    this.forceHistory = [] // 记录最近20次有效切割力度值
    this.perfectCountConsecutive = 0 // 连续完美切割计数
    this.heavyCountConsecutive = 0 // 连续重按计数
    this.dynamicRanges = {} // 动态区间缓存
    this.initDynamicRanges()
  }

  initDynamicRanges() {
    // 初始化动态区间（使用原始配置）
    Object.keys(FRUIT_CONFIG).forEach(key => {
      const fruit = FRUIT_CONFIG[key]
      this.dynamicRanges[key] = [...fruit.perfectRange]
    })
  }

  // 记录切割力度（完美判定时调用）
  recordForce(force) {
    this.forceHistory.push(force)
    if (this.forceHistory.length > GAME_CONSTANTS.AI_HISTORY_SIZE) {
      this.forceHistory.shift()
    }
    console.log(`[AI] 记录力度: ${force.toFixed(2)}, 历史数量: ${this.forceHistory.length}`)
  }

  // 计算滑动平均值和标准差
  calculateStats() {
    if (this.forceHistory.length === 0) {
      return { mean: 0.5, stdDev: 0.1 }
    }

    const mean = this.forceHistory.reduce((a, b) => a + b, 0) / this.forceHistory.length
    const variance = this.forceHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.forceHistory.length
    const stdDev = Math.sqrt(variance)

    return { mean, stdDev }
  }

  // 动态调整下一波的完美区间
  adjustRangeForNextWave() {
    const { mean, stdDev } = this.calculateStats()

    Object.keys(this.dynamicRanges).forEach(key => {
      const originalRange = FRUIT_CONFIG[key].perfectRange
      const rangeWidth = originalRange[1] - originalRange[0]

      // 根据玩家历史数据调整范围
      let newLower = mean - 0.15 * stdDev
      let newUpper = mean + 0.15 * stdDev

      // 限制范围宽度
      const newWidth = newUpper - newLower
      if (newWidth < 0.10) {
        const center = (newLower + newUpper) / 2
        newLower = center - 0.05
        newUpper = center + 0.05
      } else if (newWidth > 0.35) {
        const center = (newLower + newUpper) / 2
        newLower = center - 0.175
        newUpper = center + 0.175
      }

      // 保证范围在有效区间内
      newLower = Math.max(0, newLower)
      newUpper = Math.min(1.0, newUpper)

      this.dynamicRanges[key] = [newLower, newUpper]
      console.log(`[AI] 调整 ${FRUIT_CONFIG[key].name} 范围: [${newLower.toFixed(2)}, ${newUpper.toFixed(2)}]`)
    })
  }

  // 更新连续完美计数
  updatePerfectCount(isPerfect) {
    if (isPerfect) {
      this.perfectCountConsecutive++
    } else {
      this.perfectCountConsecutive = 0
    }
  }

  // 更新连续重按计数
  updateHeavyCount(force) {
    if (force > 0.9) {
      this.heavyCountConsecutive++
    } else {
      this.heavyCountConsecutive = 0
    }
  }

  // 判断是否应该插入陷阱（暗黑果实）
  shouldInsertTrap() {
    if (this.perfectCountConsecutive >= GAME_CONSTANTS.CONSECUTIVE_PERFECT_THRESHOLD) {
      this.perfectCountConsecutive = 0
      console.log('[AI] 心流状态检测！插入暗黑果实陷阱')
      return true
    }
    return false
  }

  // 判断是否应该调整硬壳类上限（迎合重手玩家）
  shouldAdjustCoconutUpper() {
    if (this.heavyCountConsecutive >= GAME_CONSTANTS.CONSECUTIVE_HEAVY_THRESHOLD) {
      this.heavyCountConsecutive = 0
      const currentRange = this.dynamicRanges['coconut']
      if (currentRange[1] < 0.93) {
        currentRange[1] = Math.min(0.93, currentRange[1] + 0.03)
        console.log(`[AI] 检测重手习惯，椰子上限提升至 ${currentRange[1].toFixed(2)}`)
      }
      return true
    }
    return false
  }

  // 获取当前波次的动态区间
  getDynamicRange(fruitKey) {
    return this.dynamicRanges[fruitKey] || FRUIT_CONFIG[fruitKey].perfectRange
  }

  // 重置AI状态（游戏结束）
  reset() {
    this.forceHistory = []
    this.perfectCountConsecutive = 0
    this.heavyCountConsecutive = 0
    this.initDynamicRanges()
    console.log('[AI] 系统已重置')
  }
}

module.exports = AISystem
