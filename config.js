const CONFIG = {
    tileSize: 40,
    cols: 20,
    rows: 9,
    startMoney: 150, 
    startLives: 5,
    baseEnemyHp: 44, // 45 -> 50 (初期値は少し上げておく)
    moneyPerKill: 6, // 8 -> 6 (敵が倒しやすくなるため、報酬を減らしてバランスを取る)
    bossWaveInterval: 5,
    upgradeCostShield: 1.5, // 次のレベルへの費用倍率（例：設置費用の1.5倍）
    maxTowerLevel: 5        // 最大レベル
};

const TOWERS = {
    spray: {
        id: 'spray',
        name: 'スプレー',
        icon: '🧴',
        cost: 60,
        range: 3.5,
        damage: 20,
        cooldown: 15,
        color: '#63b3ed',
        desc: '基本武装。'
    },
    trap: {
        id: 'trap',
        name: '粘着罠',
        icon: '🕸️',
        cost: 90,
        range: 2.2,
        damage: 10,
        slow: 0.4,
        cooldown: 8, 
        color: '#ed8936',
        desc: '敵を遅くする。'
    },
    zapper: {
        id: 'zapper',
        name: '電撃',
        icon: '⚡',
        cost: 220,
        range: 4.5,
        damage: 100,
        cooldown: 65, // 80 -> 65 (回転率を上げてボス・硬い敵への対応力を強化)
        color: '#9f7aea',
        desc: '対ボス用高火力。'
    },
    poison: {
        id: 'poison',
        name: '猛毒',
        icon: '☠️',
        cost: 350,
        range: 3.0, // 2.8 -> 3.0 (範囲微増)
        damage: 5,
        cooldown: 5, // 4 -> 3 (毒のダメージ発生頻度アップ)
        area: true,
        color: '#48bb78',
        desc: '範囲継続ダメージ。'
    }
};

// Enemy Types (Buffed)
const ENEMIES = [
    // Standard Ant: Basic unit
    { name: 'Ant', icon: '🐜', speed: 0.06, hpMod: 1.0, reward: 5 },
    // Roach: Fast and bit tanky
    { name: 'Roach', icon: '🪳', speed: 0.09, hpMod: 1.2, reward: 12 },
    // Spider: Tank
    { name: 'Spider', icon: '🕷️', speed: 0.04, hpMod: 3.5, reward: 20 },
    // Fly: Very fast, low HP
    { name: 'Fly', icon: '🪰', speed: 0.11, hpMod: 0.5, reward: 10 }
];
