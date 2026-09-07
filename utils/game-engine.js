// 游戏逻辑引擎
const { FRUIT_CONFIG, WAVE_CONFIG, GAME_CONSTANTS } = require('./config.js')
const AISystem = require('./ai-system.js')

class GameEngine {
  constructor() {
    this.blood = GAME_CONSTANTS.MAX_BLOOD
    this.wave = 0
    this.score = 0
    this.perfectCount = 0
    this.missCount = 0
    this.gameOver = false
    this.gamePaused = false
    this.currentFruits = []
    this.ai = new AISystem()
    this.lastTouchTime = 0
    this.gaugeCount = GAME_CONSTANTS.INITIAL_GAUGE_COUNT
    this.debuffState = null // 当前Debuff状态
    this.debuffTimer = null
    this.forceStats = { totalForce: 0, totalCuts: 0 } // 用于生成战绩
  }

  // 初始化新的一波
  initNewWave() {
    this.wave++
    console.log(`[Game] 第 ${this.wave} 波开始`)

    if (this.wave > WAVE_CONFIG.length) {
      // 无尽模式
      this.currentFruits = this.generateEndlessWave()
    } else {
      const waveConfig = WAVE_CONFIG[this.wave - 1]
      this.currentFruits = this.generateWaveFruits(waveConfig)
    }

    return this.currentFruits
  }

  // 生成波次水果
  generateWaveFruits(waveConfig) {
    const fruits = []
    const fruitTypes = waveConfig.fruits
    const shouldInsertTrap = this.ai.shouldInsertTrap()

    fruitTypes.forEach((fruitType, index) => {
      let actualType = fruitType
      if (shouldInsertTrap && index === 0) {
        actualType = 'darkFruit'
      }

      const fruitConfig = FRUIT_CONFIG[actualType]
      const dynamicRange = this.ai.getDynamicRange(actualType)

      fruits.push({
        id: Date.now() + index,
        type: actualType,
        name: fruitConfig.name,
        color: fruitConfig.color,
        speed: waveConfig.speed,
        perfectRange: dynamicRange,
        startTime: Date.now() + (index * waveConfig.interval * 1000),
        showGauge: waveConfig.showGauge && index === 0,
        touched: false
      })
    })

    return fruits
  }

  // 生成无尽模式水果
  generateEndlessWave() {
    const fruitKeys = Object.keys(FRUIT_CONFIG)
    const numFruits = Math.random() < 0.5 ? 2 : 3
    const fruits = []

    for (let i = 0; i < numFruits; i++) {
      const fruitKey = fruitKeys[Math.floor(Math.random() * fruitKeys.length)]
      const fruitConfig = FRUIT_CONFIG[fruitKey]
      const dynamicRange = this.ai.getDynamicRange(fruitKey)

      fruits.push({
        id: Date.now() + i,
        type: fruitKey,
        name: fruitConfig.name,
        color: fruitConfig.color,
        speed: 6.0,
        perfectRange: dynamicRange,
        startTime: Date.now() + (i * 100),
        showGauge: false,
        touched: false
      })
    }

    return fruits
  }

  // 处理触摸事件
  handleTouch(touchData) {
    const now = Date.now()

    // 冷却检查
    if (now - this.lastTouchTime < GAME_CONSTANTS.TOUCH_COOLDOWN) {
      return { valid: false, message: '手速太快，冷静一下' }
    }

    // 有效触摸面积检查
    const touchArea = touchData.area
    if (touchArea < GAME_CONSTANTS.MIN_TOUCH_AREA) {
      this.blood -= 1
      return { valid: false, message: '无效触摸', damage: 1 }
    }

    this.lastTouchTime = now

    // 计算力度值
    const force = this.calculateForce(touchData)

    // 查找并判定水果
    const result = this.judgeFrame(force)

    return { valid: true, force, result }
  }

  // 计算力度值（iOS & Android适配）
  calculateForce(touchData) {
    const { forceValue, pressDuration, radiusX, radiusY, isIOS } = touchData

    if (isIOS && forceValue !== undefined) {
      // iOS: 直接使用touch.force
      return Math.min(1.0, forceValue)
    } else {
      // Android: 按压时长 + 触摸面积加权
      const forcePart = Math.min(pressDuration / GAME_CONSTANTS.PERFECT_WINDOW, 1.0)
      const avgRadius = (radiusX + radiusY) / 2
      const radiusPart = Math.min(avgRadius / 50, 1.0)

      const force = forcePart * GAME_CONSTANTS.FORCE_CALIBRATION_ANDROID + 
                    radiusPart * GAME_CONSTANTS.RADIUS_CALIBRATION_ANDROID
      return Math.min(1.0, force)
    }
  }

  // 判定水果（核心逻辑）
  judgeFrame(force) {
    let bestMatch = null
    let bestDistance = Infinity

    // 找到最接近的水果
    for (let fruit of this.currentFruits) {
      if (fruit.touched) continue

      const [lower, upper] = fruit.perfectRange
      const mid = (lower + upper) / 2
      const distance = Math.abs(force - mid)

      if (distance < bestDistance) {
        bestDistance = distance
        bestMatch = fruit
      }
    }

    if (!bestMatch) {
      return { result: 'miss', message: '没有水果被切割' }
    }

    bestMatch.touched = true
    const [lower, upper] = bestMatch.perfectRange
    const fruitConfig = FRUIT_CONFIG[bestMatch.type]

    // 判定逻辑
    let judgeResult = {}
    if (force >= lower && force <= upper) {
      // 完美
      judgeResult = {
        result: 'perfect',
        message: 'PERFECT! +1血',
        effect: 'perfect',
        damage: -1,
        isPerfect: true
      }
      this.score += 10
      this.perfectCount++
      this.ai.recordForce(force)
      this.ai.updatePerfectCount(true)
      this.forceStats.totalForce += force
      this.forceStats.totalCuts++

      // 触发AI调参
      this.ai.adjustRangeForNextWave()
    } else if (force < lower) {
      // 轻按
      judgeResult = {
        result: 'light',
        message: fruitConfig.lightPunish.effect,
        effect: 'light',
        damage: fruitConfig.lightPunish.damage,
        isPerfect: false
      }
      this.ai.updatePerfectCount(false)
    } else {
      // 重按
      judgeResult = {
        result: 'heavy',
        message: fruitConfig.heavyPunish.effect,
        effect: 'heavy',
        damage: fruitConfig.heavyPunish.damage,
        isPerfect: false
      }
      this.ai.updatePerfectCount(false)
      this.ai.updateHeavyCount(force)
      this.ai.shouldAdjustCoconutUpper()
    }

    // 应用伤害
    this.blood += judgeResult.damage // damage通常为负数
    if (this.blood < 0) this.blood = 0

    // 触发Debuff
    if (fruitConfig.debuff) {
      this.triggerDebuff(fruitConfig.debuff)
    }

    console.log(`[Judge] ${bestMatch.name} | Force: ${force.toFixed(2)} | Result: ${judgeResult.result}`)

    return judgeResult
  }

  // 触发Debuff效果
  triggerDebuff(debuffType) {
    this.debuffState = debuffType
    console.log(`[Debuff] 触发: ${debuffType}`)

    if (this.debuffTimer) {
      clearTimeout(this.debuffTimer)
    }

    this.debuffTimer = setTimeout(() => {
      this.debuffState = null
      console.log('[Debuff] 状态解除')
    }, GAME_CONSTANTS.DEBUFF_DURATION)
  }

  // 漏掉一个水果
  missFruit() {
    this.missCount++
    this.blood -= 1
    console.log(`[Game] 漏掉水果，失误次数: ${this.missCount}, 剩余血量: ${this.blood}`)

    if (this.missCount >= GAME_CONSTANTS.MISS_LIMIT) {
      this.endGame()
      return { gameOver: true, reason: '失误次数过多' }
    }

    if (this.blood <= 0) {
      this.endGame()
      return { gameOver: true, reason: '血量耗尽' }
    }

    return { gameOver: false }
  }

  // 结束游戏
  endGame() {
    this.gameOver = true
    console.log(`[Game] 游戏结束 | 波次: ${this.wave} | 得分: ${this.score} | 完美率: ${((this.perfectCount / Math.max(this.forceStats.totalCuts, 1)) * 100).toFixed(1)}%`)
  }

  // 获取游戏统计数据
  getStats() {
    const perfectRate = this.forceStats.totalCuts > 0 ? (this.perfectCount / this.forceStats.totalCuts * 100).toFixed(1) : 0
    const avgForce = this.forceStats.totalCuts > 0 ? (this.forceStats.totalForce / this.forceStats.totalCuts).toFixed(2) : 0

    return {
      wave: this.wave,
      score: this.score,
      perfectCount: this.perfectCount,
      totalCuts: this.forceStats.totalCuts,
      perfectRate: perfectRate,
      avgForce: avgForce,
      missCount: this.missCount
    }
  }

  // 重置游戏
  reset() {
    this.blood = GAME_CONSTANTS.MAX_BLOOD
    this.wave = 0
    this.score = 0
    this.perfectCount = 0
    this.missCount = 0
    this.gameOver = false
    this.currentFruits = []
    this.ai.reset()
    this.lastTouchTime = 0
    this.gaugeCount = GAME_CONSTANTS.INITIAL_GAUGE_COUNT
    this.debuffState = null
    this.forceStats = { totalForce: 0, totalCuts: 0 }
    console.log('[Game] 游戏已重置')
  }
}

module.exports = GameEngine
