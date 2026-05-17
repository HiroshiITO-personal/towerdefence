class Tower {
    constructor(c, r, typeKey) {
        this.c = c;
        this.r = r;
        this.x = c * CONFIG.tileSize + CONFIG.tileSize/2;
        this.y = r * CONFIG.tileSize + CONFIG.tileSize/2;
        this.type = TOWERS[typeKey];
        this.level = 1; // 初期レベル
        this.cooldown = 0;
        this.angle = 0;
    }

    // アップグレードメソッド
    upgrade() {
        if (this.level < CONFIG.maxTowerLevel) {
            this.level++;
            // レベルアップごとに性能を約30%〜50%向上させる例
            return true;
        }
        return false;
    }

    // 現在の攻撃力を取得（レベル補正）
    getDamage() {
        return this.type.damage * (1 + (this.level - 1) * 0.5);
    }

    // 現在の射程を取得（レベル補正）
    getRange() {
        return this.type.range * CONFIG.tileSize * (1 + (this.level - 1) * 0.1);
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;

        let target = null;
        let bestScore = -Infinity;

        // 【修正】ターゲット選定ロジックを変更
        // pathIdx (ゴールまでの進行度) が Enemy 側に実装されていないため、
        // 単純に「タワーに物理的に近い敵」を優先するように変更します。
        for (const enemy of state.enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);

            // 修正：レベル補正後の射程を使用
            if (dist <= this.getRange()) {
                const score = -dist; 
                if (score > bestScore) {
                    bestScore = score;
                    target = enemy;
                }
            }
            
            // 射程内か判定
            if (dist <= this.type.range * CONFIG.tileSize) {
                
                // 修正前: const score = enemy.pathIdx * 1000 - dist;
                // pathIdx が undefined なので計算できませんでした。
                
                // 修正後: 距離が近いほどスコアを高くする（-dist が大きい＝距離が小さい）
                const score = -dist; 

                if (score > bestScore) {
                    bestScore = score;
                    target = enemy;
                }
            }
        }

        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.cooldown <= 0) {
                this.fire(target);
                this.cooldown = this.type.cooldown;
            }
        }
    }

    fire(target) {
        if (this.type.id === 'spray' || this.type.id === 'zapper') {
            state.projectiles.push({
                x: this.x, y: this.y,
                tx: target.x, ty: target.y,
                target: target,
                type: this.type,
                active: true
            });
            if (this.type.id === 'zapper') {
                target.hp -= this.type.damage;
                createParticles(target.x, target.y, '#f6e05e', 5);
            }
        } else if (this.type.id === 'trap') {
             state.projectiles.push({
                x: this.x, y: this.y,
                target: target,
                type: this.type,
                active: true,
                speed: 6
            });
        } else if (this.type.id === 'poison') {
            for (const enemy of state.enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.type.range * CONFIG.tileSize) {
                    enemy.hp -= this.type.damage;
                    if (Math.random() < 0.2) createParticles(enemy.x, enemy.y, '#68d391', 1);
                }
            }
        }
    }

    draw(ctx) {
        // Base
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(this.c * CONFIG.tileSize + 2, this.r * CONFIG.tileSize + 2, CONFIG.tileSize - 4, CONFIG.tileSize - 4);
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.c * CONFIG.tileSize + 4, this.r * CONFIG.tileSize + 4, CONFIG.tileSize - 8, CONFIG.tileSize - 8);

        ctx.font = `${CONFIG.tileSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y);

        // レベルを星や数字で表示
        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Lv" + this.level, this.x, this.y + 15);
        
        // Turret
        if (this.type.id !== 'poison') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.type.color;
            ctx.fillRect(0, -3, 16, 6);
            ctx.restore();
        }
        
        // Cooldown
        if (this.cooldown > 0) {
            const percent = this.cooldown / this.type.cooldown;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, CONFIG.tileSize/2 - 2, -Math.PI/2, -Math.PI/2 + (Math.PI*2 * percent));
            ctx.fill();
        }

        
    }
}