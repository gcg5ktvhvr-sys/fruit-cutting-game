// 水果图鉴与配置表
const FRUIT_CONFIG = {
  watermelon: {
    id: 1,
    name: '西瓜',
    type: '脆皮类',
    perfectRange: [0.40, 0.60],
    color: '#ff1744',
    debuff: null,
    lightPunish: { damage: 1, effect: '弹开' },
    heavyPunish: { damage: 2, effect: '炸裂溅射' }
  },
  coconut: {
    id: 2,
    name: '椰子',
    type: '硬壳类',
    perfectRange: [0.70, 0.90],
    color: '#8d6e63',
    debuff: null,
    lightPunish: { damage: 2, effect: '反弹砸脸' },
    heavyPunish: { damage: -1, effect: '敲碎完美' }
  },
  darkFruit: {
    id: 3,
    name: '暗黑果实',
    type: '幽灵类',
    perfectRange: [0.00, 0.15],
    color: '#212121',
    debuff: '屏幕倒置+左右反转',
    lightPunish: { damage: 0, effect: '诅咒' },
    heavyPunish: { damage: 0, effect: '诅咒' }
  },
  balloon: {
    id: 4,
    name: '气球果',
    type: '易爆类',
    perfectRange: [0.50, 0.70],
    color: '#e91e63',
    debuff: '屏幕红雾',
    lightPunish: { damage: 0, effect: '慢速飘走' },
    heavyPunish: { damage: 3, effect: '直接爆炸' }
  },
  diamond: {
    id: 5,
    name: '钻石果',
    type: '稀有类',
    perfectRange: [0.85, 0.95],
    color: '#00bcd4',
    debuff: null,
    lightPunish: { damage: 0, effect: '弹飞' },
    heavyPunish: { damage: 1, effect: '碎裂' }
  }
}

// 波次难度配置
const WAVE_CONFIG = [
  { waveNum: 1, fruits: ['watermelon'], speed: 2.0, interval: 0, showGauge: true, description: '教学波' },
  { waveNum: 2, fruits: ['coconut'], speed: 2.5, interval: 0, showGauge: false, description: '盲测' },
  { waveNum: 3, fruits: ['watermelon', 'darkFruit'], speed: 3.0, interval: 0.5, showGauge: false, description: '首次诅咒' },
  { waveNum: 4, fruits: ['watermelon', 'coconut'], speed: 3.5, interval: 0.3, showGauge: false, description: 'AI介入' },
  { waveNum: 5, fruits: ['coconut', 'balloon'], speed: 3.8, interval: 0.3, showGauge: false, description: 'AI调参' },
  { waveNum: 6, fruits: ['watermelon', 'balloon'], speed: 4.0, interval: 0.3, showGauge: false, description: 'AI调参' },
  { waveNum: 7, fruits: ['balloon', 'diamond'], speed: 4.5, interval: 0.2, showGauge: false, description: '极端反差' },
  { waveNum: 8, fruits: ['watermelon', 'coconut', 'darkFruit'], speed: 5.0, interval: 0.1, showGauge: false, description: '高速连切' },
  { waveNum: 9, fruits: ['coconut', 'balloon', 'diamond'], speed: 5.5, interval: 0.1, showGauge: false, description: '地狱难度' },
  { waveNum: 10, fruits: ['watermelon', 'coconut', 'balloon', 'darkFruit', 'diamond'], speed: 6.0, interval: 0.1, showGauge: false, description: '终极挑战' }
]

// 游戏常量
const GAME_CONSTANTS = {
  MAX_BLOOD: 3,
  TOUCH_COOLDOWN: 300, // ms
  PERFECT_WINDOW: 800, // ms 按压时间映射阈值
  FORCE_CALIBRATION_ANDROID: 0.7, // 安卓按压时长权重
  RADIUS_CALIBRATION_ANDROID: 0.3, // 安卓触摸面积权重
  MIN_TOUCH_AREA: 5, // mm²
  DEBUFF_DURATION: 4000, // ms
  INITIAL_GAUGE_COUNT: 3,
  MISS_LIMIT: 3, // 漏掉3个水果游戏结束
  AI_HISTORY_SIZE: 20, // AI记录最近20次切割
  CONSECUTIVE_PERFECT_THRESHOLD: 3, // 连续3次完美触发诅咒
  CONSECUTIVE_HEAVY_THRESHOLD: 2 // 连续2次重按调整区间
}

module.exports = {
  FRUIT_CONFIG,
  WAVE_CONFIG,
  GAME_CONSTANTS
}
