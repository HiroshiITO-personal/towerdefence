class Enemy {
    constructor(typeIdx, wave, isBoss = false) {
        const type = ENEMIES[typeIdx];
        this.type = type;
        this.isBoss = isBoss;
        
        // 座標管理
        this.col = state.startPoint.c;
        this.row = state.startPoint.r;

        // 【追加】直前の座標を初期化（最初のマスから来た方向を特定するために必要）
        this.prevC = this.col; 
        this.prevR = this.row; 
        
        // 現在の目標座標
        this.targetC = this.col;
        this.targetR = this.row;

        this.x = this.col * CONFIG.tileSize + CONFIG.tileSize/2;
        this.y = this.row * CONFIG.tileSize + CONFIG.tileSize/2;

        
        // HP計算ロジック（省略）
        let hpMultiplier = Math.pow(1.08, wave - 1);

        // さらにWaveが進むと、少しだけ基礎HPも底上げ（線形加算）
        hpMultiplier += (wave * 0.9); 

        if (isBoss) {
            hpMultiplier *= 5; // ボス倍率は6→5へ微調整
            // ボスの速度設定（変更なし）
            this.speed = type.speed * CONFIG.tileSize * 0.5;
            this.radius = CONFIG.tileSize * 0.6;
            this.reward = type.reward * 7;
        } else {
            // ザコ敵の速度設定
            this.speed = type.speed * CONFIG.tileSize;
            this.radius = CONFIG.tileSize * 0.35;
            this.reward = type.reward;
        }

        // 【追加】高Waveになると敵が少しずつ速くなる（上限1.5倍）
        // Wave 10で1.1倍, Wave 50で1.5倍
        let speedBoost = 1 + Math.min(0.5, (wave * 0.01));
        this.speed *= speedBoost;

        // HP計算
        this.maxHp = Math.floor(CONFIG.baseEnemyHp * type.hpMod * hpMultiplier);
        this.hp = this.maxHp;
        this.baseSpeed = this.speed;
        this.frozenTimer = 0;

        
    }

    // 【ヘルパー関数】方向を右に90度回転 (経路探索ロジック変更により、現在は使用されていません)
    getRightHandDir(dir) {
        return {dc: -dir.dr, dr: dir.dc};
    }

    // 【ヘルパー関数】方向を左に90度回転 (経路探索ロジック変更により、現在は使用されていません)
    getLeftHandDir(dir) {
        return {dc: dir.dr, dr: -dir.dc};
    }
    
    // 【ヘルパー関数】逆方向 (経路探索ロジック変更により、現在は使用されていません)
    getOppositeDir(dir) {
        return {dc: -dir.dc, dr: -dir.dr};
    }

    /**
     * Enemyの移動と状態更新を処理します。
     * @returns {string} 'finished' または 'active'
     */
    update() {
        if (this.frozenTimer > 0) {
            this.frozenTimer--;
            this.speed = this.baseSpeed * (this.isBoss ? 0.7 : 0.4);
        } else {
            this.speed = this.baseSpeed;
        }

        const tx = this.targetC * CONFIG.tileSize + CONFIG.tileSize/2;
        const ty = this.targetR * CONFIG.tileSize + CONFIG.tileSize/2;
        
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        // 目標に到達した場合
        if (dist < this.speed) {
            
            // 現在の位置を直前の位置として保存
            this.prevC = this.col; 
            this.prevR = this.row;
            
            // 座標をターゲットの位置に更新
            this.x = tx;
            this.y = ty;
            this.col = this.targetC; 
            this.row = this.targetR;

            // 1. ゴール判定
            const isGoal = state.endPoints.some(p => p.c === this.col && p.r === this.row);
            
            if (isGoal) {
                return 'finished'; 
            }

            // 2. 次の行き先を決める (ケーキ優先探索)
            const nextOptions = state.navMap[this.row][this.col];

            if (!nextOptions || nextOptions.length === 0) {
                this.targetC = this.col; 
                this.targetR = this.row;
                return 'active';
            }
            
            // --- 【修正】ゴール（ケーキ）優先探索ロジック ---
            
            // ゴール地点を取得
            const goal = state.endPoints[0];

            let bestNextPos = null;
            let minDistance = Infinity;
            let candidates = []; // 有効な移動先候補を格納

            for (const next of nextOptions) {
                
                // 分岐点では直前に来たマスへの逆走を避ける (行き止まりの場合は除く)
                if (next.c === this.prevC && next.r === this.prevR) {
                    if (nextOptions.length > 1) { 
                        continue; 
                    } 
                }
                
                // ゴールまでのマンハッタン距離を計算
                const distance = Math.abs(goal.c - next.c) + Math.abs(goal.r - next.r);
                
                // 候補リストに追加
                candidates.push({pos: next, distance: distance});
            }
            
            // 候補がない（行き止まりで戻るしかない）場合は、直前のマスへのパスを候補に戻す
            if (candidates.length === 0) {
                 const prevPos = nextOptions.find(opt => opt.c === this.prevC && opt.r === this.prevR);
                 if (prevPos) candidates.push({pos: prevPos, distance: Infinity}); 
            }


            // 候補を距離でソートし、最も近いものを選ぶ
            if (candidates.length > 0) {
                // 距離が短い順にソート (0番目が最短)
                candidates.sort((a, b) => a.distance - b.distance);
                
                let selectedCandidate = null;

                // 【修正】WAVEに応じて脇道確率を動的に調整
                // 脇道確率の基準値 (0.3) から、WAVE数 * 0.02 ずつ減少させる
                const baseDeviationChance = 0.3;
                const wavePenalty = (state.wave - 1) * 0.02; // WAVE 1では 0.0、WAVE 2では 0.02 減
                const detourChance = Math.max(0, baseDeviationChance - wavePenalty); // 確率が0を下回らないようにする

                // 脇道確率 (detourChance) で脇道を選ぶ (候補が2つ以上ある場合のみ)
                if (candidates.length > 1 && Math.random() < detourChance) {
                    // 最短ではないパス (index 1以降) からランダムに選択
                    const detourIndex = 1 + Math.floor(Math.random() * (candidates.length - 1));
                    selectedCandidate = candidates[detourIndex];
                }

                // 脇道が選ばれなかった、または候補が1つしかない場合は「最短ルート」を選ぶ
                if (!selectedCandidate) {
                    const minDistance = candidates[0].distance;
                    // 同じ最短距離の候補が複数ある場合は、その中からランダム
                    const bestCandidates = candidates.filter(c => c.distance === minDistance);
                    selectedCandidate = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
                }

                bestNextPos = selectedCandidate.pos;
            }
            
            // 次の目標を設定
            const next = bestNextPos || nextOptions[0]; // フォールバック
            

            this.targetC = next.c;
            this.targetR = next.r;

            // --- ゴール優先探索ロジックここまで ---

        } else {
            // 移動中
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        return 'active';
    }

    draw(ctx) {
        // 描画処理
        const scale = this.isBoss ? 1.8 : 1.0;
        ctx.font = `${CONFIG.tileSize * 0.7 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.isBoss) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
        }
        ctx.fillText(this.type.icon, this.x, this.y);
        ctx.shadowBlur = 0;

        const hpPercent = this.hp / this.maxHp;
        const barWidth = this.isBoss ? 40 : 20;
        const barY = this.y - (this.isBoss ? 25 : 15);
        
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, 4);
        ctx.fillStyle = hpPercent < 0.3 ? '#fc8181' : (hpPercent < 0.6 ? '#f6ad55' : '#68d391');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * hpPercent, 4);
        
        if (this.frozenTimer > 0) {
            ctx.fillStyle = 'rgba(99, 179, 237, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}