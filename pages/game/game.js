// pages/game/game.js
const GameEngine = require('../../utils/game-engine.js')
const { FRUIT_CONFIG, WAVE_CONFIG, GAME_CONSTANTS } = require('../../utils/config.js')

Page({
  data: {
    // 屏幕信息
    screenWidth: 0,
    screenHeight: 0,
    
    // 游戏状态
    gameStarted: false,
    gameOver: false,
    gamePaused: false,
    
    // 游戏数据
    wave: 0,
    score: 0,
    blood: GAME_CONSTANTS.MAX_BLOOD,
    maxBlood: GAME_CONSTANTS.MAX_BLOOD,
    missCount: 0,
    perfectRate: '0.0',
    avgForce: '0.00',
    handGrade: '普通',
    
    // UI数据
    fruits: [],
    judgementTexts: [],
    gaugeCount: GAME_CONSTANTS.INITIAL_GAUGE_COUNT,
    debuffState: null,
    
    // 调试数据
    lastForce: 0,
    lastTouchArea: 0,
    showDebug: false,
    
    // 触摸跟踪
    touchStartTime: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchForceValue: 0,
    
    // 游戏引擎
    gameEngine: null,
    
    // 动画循环
    animationFrameId: null
  },

  onLoad: function() {
    this.initScreen()
    this.initGame()
    console.log('[Page] 页面加载完成')
  },

  onUnload: function() {
    if (this.data.animationFrameId) {
      cancelAnimationFrame(this.data.animationFrameId)
    }
  },

  // 初始化屏幕
  initScreen: function() {
    const info = wx.getSystemInfoSync()
    const screenWidth = info.screenWidth
    const screenHeight = info.screenHeight
    console.log(`[Screen] 分辨率: ${screenWidth}x${screenHeight}px`)
    
    this.setData({
      screenWidth: screenWidth,
      screenHeight: screenHeight
    })
  },

  // 初始化游戏引擎
  initGame: function() {
    const gameEngine = new GameEngine()
    this.setData({ gameEngine })
    console.log('[Game] 游戏引擎初始化完成')
  },

  // 开始游戏
  startGame: function() {
    console.log('[Game] 游戏开始')
    this.setData({
      gameStarted: true,
      gameOver: false,
      gamePaused: false
    })
    this.startNextWave()
  },

  // 开始下一波
  startNextWave: function() {
    const { gameEngine } = this.data
    
    if (gameEngine.gameOver) {
      this.endGame()
      return
    }

    const fruits = gameEngine.initNewWave()
    const waveConfig = gameEngine.wave <= WAVE_CONFIG.length ? WAVE_CONFIG[gameEngine.wave - 1] : null
    
    const displayFruits = fruits.map(fruit => ({
      ...fruit,
      displayX: this.data.screenWidth / 2 - 50, // 中心位置
      displayY: 100 + Math.random() * 200, // 随机高度
      opacity: 1
    }))

    this.setData({
      fruits: displayFruits,
      wave: gameEngine.wave,
      blood: gameEngine.blood,
      score: gameEngine.score,
      missCount: gameEngine.missCount,
      debuffState: gameEngine.debuffState
    })

    // 开始水果下落动画
    this.animateFruits(displayFruits)
  },

  // 水果下落动画
  animateFruits: function(fruits) {
    const { gameEngine, screenHeight } = this.data
    const waveConfig = gameEngine.wave <= WAVE_CONFIG.length ? WAVE_CONFIG[gameEngine.wave - 1] : null
    const speed = waveConfig ? waveConfig.speed : 6.0 // m/s
    const pixelsPerMs = (speed * 100) / 1000 // rpx转px的转换
    
    const startTime = Date.now()
    const duration = (screenHeight * 2) / pixelsPerMs // 总下落时间

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / (duration * 1000)

      if (progress > 1) {
        // 水果下落完成，判定为漏掉
        fruits.forEach(fruit => {
          if (!fruit.touched) {
            const result = gameEngine.missFruit()
            if (result.gameOver) {
              this.setData({
                gameOver: true,
                blood: gameEngine.blood,
                missCount: gameEngine.missCount
              })
              this.updateStats()
              return
            }
          }
        })
        
        if (!this.data.gameOver && !this.data.gamePaused) {
          // 等待300ms后开始下一波
          setTimeout(() => {
            if (this.data.gameStarted && !this.data.gamePaused) {
              this.startNextWave()
            }
          }, 300)
        }
        return
      }

      const updatedFruits = fruits.map(fruit => {
        const yOffset = (screenHeight * progress)
        return {
          ...fruit,
          displayY: 100 + (screenHeight * 0.6 * progress),
          opacity: 1 - Math.max(0, (progress - 0.8) / 0.2) // 最后20%淡出
        }
      })

      this.setData({ fruits: updatedFruits })
      
      if (!this.data.gamePaused && !this.data.gameOver) {
        this.data.animationFrameId = requestAnimationFrame(animate)
      }
    }

    this.data.animationFrameId = requestAnimationFrame(animate)
  },

  // 触摸开始
  handleTouchStart: function(e) {
    if (!this.data.gameStarted || this.data.gameOver || this.data.gamePaused) return

    const touch = e.touches[0]
    const startTime = Date.now()

    this.setData({
      touchStartTime: startTime,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      touchForceValue: touch.force || 0
    })

    console.log(`[Touch] 开始 @ (${touch.clientX}, ${touch.clientY})`)
  },

  // 触摸移动
  handleTouchMove: function(e) {
    if (!this.data.gameStarted || this.data.gameOver || this.data.gamePaused) return

    const touch = e.touches[0]
    const now = Date.now()
    const pressDuration = now - this.data.touchStartTime

    // 实时振动反馈（模拟）
    const force = this.calculateForce({
      forceValue: touch.force || 0,
      pressDuration: pressDuration,
      radiusX: touch.radiusX || 10,
      radiusY: touch.radiusY || 10,
      isIOS: wx.getSystemInfoSync().platform === 'ios'
    })

    // 触发马达振动（仅支持安卓和部分iOS）
    if (pressDuration < 800) {
      const intensity = Math.min(force, 1.0)
      wx.vibrate()
    }

    this.setData({
      touchForceValue: force,
      lastForce: force
    })
  },

  // 触摸结束 - 核心判定逻辑
  handleTouchEnd: function(e) {
    if (!this.data.gameStarted || this.data.gameOver || this.data.gamePaused) return

    const touch = e.changedTouches[0]
    const now = Date.now()
    const pressDuration = now - this.data.touchStartTime

    // 计算有效触摸面积
    const touchArea = Math.PI * (touch.radiusX || 5) * (touch.radiusY || 5)
    this.setData({ lastTouchArea: touchArea })

    // 计算最终力度值
    const force = this.calculateForce({
      forceValue: touch.force || 0,
      pressDuration: pressDuration,
      radiusX: touch.radiusX || 10,
      radiusY: touch.radiusY || 10,
      isIOS: wx.getSystemInfoSync().platform === 'ios'
    })

    const { gameEngine } = this.data
    const touchResult = gameEngine.handleTouch({
      forceValue: touch.force || 0,
      pressDuration: pressDuration,
      radiusX: touch.radiusX || 10,
      radiusY: touch.radiusY || 10,
      isIOS: wx.getSystemInfoSync().platform === 'ios',
      area: touchArea
    })

    if (touchResult.valid) {
      const judgeResult = touchResult.result
      
      // 触发触觉反馈
      this.triggerHapticFeedback(judgeResult.effect, force)
      
      // 显示判定文字
      this.showJudgementText(judgeResult.message, touch.clientX, touch.clientY, judgeResult.effect)
      
      // 更新UI
      this.setData({
        score: gameEngine.score,
        blood: gameEngine.blood,
        missCount: gameEngine.missCount,
        debuffState: gameEngine.debuffState
      })

      // 检查游戏是否结束
      if (gameEngine.blood <= 0 || gameEngine.missCount >= GAME_CONSTANTS.MISS_LIMIT) {
        this.setData({ gameOver: true })
        this.updateStats()
      }
    } else {
      // 无效触摸
      this.showJudgementText(touchResult.message, touch.clientX, touch.clientY, 'miss')
      if (touchResult.damage) {
        this.setData({
          blood: gameEngine.blood,
          missCount: gameEngine.missCount
        })
      }
    }
  },

  // 计算力度值
  calculateForce: function(touchData) {
    const { forceValue, pressDuration, radiusX, radiusY, isIOS } = touchData

    if (isIOS && forceValue !== undefined && forceValue > 0) {
      return Math.min(1.0, forceValue)
    } else {
      const forcePart = Math.min(pressDuration / GAME_CONSTANTS.PERFECT_WINDOW, 1.0)
      const avgRadius = (radiusX + radiusY) / 2
      const radiusPart = Math.min(avgRadius / 50, 1.0)

      const force = forcePart * GAME_CONSTANTS.FORCE_CALIBRATION_ANDROID + 
                    radiusPart * GAME_CONSTANTS.RADIUS_CALIBRATION_ANDROID
      return Math.min(1.0, force)
    }
  },

  // 触觉反馈
  triggerHapticFeedback: function(effectType, force) {
    // 微信小程序的振动API
    if (effectType === 'perfect') {
      wx.vibrateLong()
    } else if (effectType === 'light') {
      wx.vibrateShort()
    } else if (effectType === 'heavy') {
      wx.vibrateLong()
    }
  },

  // 显示判定文字
  showJudgementText: function(text, x, y, effect) {
    const colors = {
      perfect: '#ffd700',
      light: '#4ade80',
      heavy: '#ff6b6b',
      miss: '#999'
    }

    const judgementText = {
      id: Date.now(),
      text: text,
      x: x,
      y: y,
      color: colors[effect] || '#fff',
      opacity: 1
    }

    const currentTexts = this.data.judgementTexts
    currentTexts.push(judgementText)
    this.setData({ judgementTexts: currentTexts })

    // 1秒后移除文字
    setTimeout(() => {
      const updated = this.data.judgementTexts.filter(t => t.id !== judgementText.id)
      this.setData({ judgementTexts: updated })
    }, 1000)
  },

  // 更新统计数据
  updateStats: function() {
    const { gameEngine } = this.data
    const stats = gameEngine.getStats()
    
    let handGrade = '普通'
    const perfectRate = parseFloat(stats.perfectRate)
    const avgForce = parseFloat(stats.avgForce)
    
    if (perfectRate > 80) {
      handGrade = '大师级 👑'
    } else if (perfectRate > 60) {
      handGrade = '高手 🔥'
    } else if (perfectRate > 40) {
      handGrade = '熟手 💪'
    } else if (perfectRate > 20) {
      handGrade = '新手 🌱'
    } else {
      handGrade = '菜鸟 😅'
    }

    if (avgForce > 0.8) {
      handGrade += ' 大力怪'
    } else if (avgForce < 0.3) {
      handGrade += ' 轻手指'
    }

    this.setData({
      perfectRate: stats.perfectRate,
      avgForce: stats.avgForce,
      handGrade: handGrade
    })
  },

  // 暂停/继续
  togglePause: function() {
    const paused = !this.data.gamePaused
    this.setData({ gamePaused: paused })
    console.log(`[Game] ${paused ? '暂停' : '继续'}`)
  },

  // 重新开始
  restartGame: function() {
    this.data.gameEngine.reset()
    this.setData({
      gameStarted: false,
      gameOver: false,
      gamePaused: false,
      wave: 0,
      score: 0,
      blood: GAME_CONSTANTS.MAX_BLOOD,
      missCount: 0,
      fruits: [],
      judgementTexts: [],
      debuffState: null,
      perfectRate: '0.0',
      avgForce: '0.00',
      handGrade: '普通'
    })
    console.log('[Game] 游戏已重置')
  },

  // 显示战绩
  showStats: function() {
    const { gameEngine } = this.data
    const stats = gameEngine.getStats()
    wx.showModal({
      title: '本局战绩',
      content: `波次: ${stats.wave}\n得分: ${stats.score}\n完美率: ${stats.perfectRate}%\n平均力度: ${stats.avgForce}\n总切割数: ${stats.totalCuts}`,
      showCancel: false,
      confirmText: '继续'
    })
  },

  // 分享战绩
  shareScore: function() {
    const { wave, score, handGrade, perfectRate, avgForce } = this.data
    const shareText = `我在水果切割大师中达到了第 ${wave} 波！\n得分: ${score} | 完美率: ${perfectRate}% | 评级: ${handGrade}`
    
    wx.showModal({
      title: '分享战绩',
      content: shareText,
      confirmText: '复制分享文案',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: shareText,
            success: () => {
              wx.showToast({
                title: '已复制',
                icon: 'success',
                duration: 1500
              })
            }
          })
        }
      }
    })
  }
})
