# 快速开始指南

## 环境要求

- 微信开发者工具 (v1.06.2302270 或更新)
- Node.js 12+ (可选，用于本地开发)
- 微信账号 (用于小程序审核)

## 文件夹结构说明

```
项目根目录
├── app.js              # 应用生命周期管理
├── app.json            # 小程序配置文件（导航栏、窗口设置）
├── app.wxss            # 全局样式
├── pages/
│   └── game/           # 游戏页面
│       ├── game.js     # 游戏逻辑控制器（最重要！）
│       ├── game.wxml   # UI模板
│       ├── game.wxss   # 页面样式
│       └── game.json   # 页面配置
└── utils/
    ├── config.js       # 游戏配置表（修改难度在这里！）
    ├── game-engine.js  # 游戏核心引擎
    └── ai-system.js    # AI调参系统
```

## 运行步骤

### 方式一：微信开发者工具（推荐）

1. **打开工具**
   - 启动微信开发者工具
   
2. **导入项目**
   - 点击 "导入项目"
   - 选择本项目文件夹
   - AppID 可输入 `wx1234567890abcdef` (测试用)
   - 点击 "导入"

3. **编译和预览**
   - 点击工具栏 "编译" 或 Ctrl+S
   - 等待编译完成
   - 点击 "预览" 可扫码用手机体验
   - 或直接在 "模拟器" 标签页查看

4. **测试游戏**
   - 点击 "开始游戏" 按钮
   - 在屏幕中间触摸（模拟器用鼠标点击）
   - 观察水果是否正常下落和判定

### 方式二：命令行（可选）

```bash
# 克隆项目
git clone https://github.com/gcg5ktvhvr-sys/fruit-cutting-game.git
cd fruit-cutting-game

# 用微信开发者工具打开当前目录
# (根据你的系统选择)

# macOS
open -a "WeChat Developer Tools" .

# Windows
start wechat-devtools .

# Linux
wechat-devtools .
```

## 常见问题

### Q: 编译时报错 "Cannot find module"
A: 确保所有 `require()` 路径正确，特别是 `../` 的相对路径

### Q: 游戏运行但水果不显示
A: 检查屏幕宽高是否正确获取
```javascript
const info = wx.getSystemInfoSync()
console.log('屏幕:', info.screenWidth, info.screenHeight)
```

### Q: 触摸没有响应
A: 确保 `game.wxml` 中的 `catchtouchstart` 等事件正确绑定

### Q: iOS 和 Android 力度判定不同
A: 这是正常的，因为两个系统的硬件不同。项目已内置适配。

## 修改游戏难度

编辑 `utils/config.js`:

### 修改血量
```javascript
const GAME_CONSTANTS = {
  MAX_BLOOD: 5  // 改为5血
}
```

### 修改波次数量
```javascript
const WAVE_CONFIG = [
  // 添加新波次
  { waveNum: 11, fruits: ['diamond', 'balloon'], speed: 6.5, interval: 0.05 }
]
```

### 修改水果完美区间
```javascript
const FRUIT_CONFIG = {
  watermelon: {
    perfectRange: [0.35, 0.65]  // 改为更宽的区间
  }
}
```

## 启用调试模式

在 `pages/game/game.js` 中修改:

```javascript
data: {
  showDebug: true  // 改为 true 显示实时力度
}
```

调试面板会显示：
- 当前力度值 (0.0 ~ 1.0)
- 触摸面积 (mm²)
- 当前Debuff状态

## 测试游戏流程

### 测试完美切割
1. 看第1波教学（会显示绿色标尺）
2. 在绿色区间内触摸
3. 应显示 "PERFECT! +1血" 和金色特效

### 测试轻按
1. 快速轻触（按压时间<0.3秒）
2. 应显示 "太轻了！弹飞" 和蓝色效果

### 测试重按
1. 长时间按住（>1秒）
2. 应显示 "手劲太大！-2血" 和红色效果

### 测试Debuff
1. 连续完美切割3次
2. 下一波会自动出现黑色的"暗黑果实"
3. 触摸它会显示 "诅咒降临！" 并屏幕倒置

## 性能监控

微信开发者工具内置性能分析：

1. 点击 "调试" → "Performance" 标签
2. 记录 FPS（应保持 60fps）
3. 观察内存使用（不应持续增长）

## 打包发布

完成开发后，进行真机测试：

1. 扫码预览在实际手机上运行
2. 测试所有交互和动画
3. 确认马达振动和触摸反馈正常
4. 检查各种屏幕尺寸的适配情况

然后提交微信审核：
1. 工具栏 → "上传代码"
2. 填写版本号和说明
3. 等待微信团队审核

## 获取帮助

- 📖 查看 README.md 了解全部功能
- 🐛 在 GitHub Issues 提交问题
- 💬 参考代码注释（中文）

---

**祝你开发愉快！** 🎉
