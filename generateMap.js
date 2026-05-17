/**
 * 上下1マス壁固定・到達保証マップ生成
 */
function generateMap() {
    // 1. 全てを一旦「壁(0)」にする
    state.map = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill(0));
    
    // 5行目（上から6段目）をメインの通り道にする
    const centerR = 5; 
    state.startPoint = {c: 0, r: centerR};
    state.endPoints = [{c: CONFIG.cols - 1, r: centerR}];

    // 迷路を作るのは「1行目〜10行目」の間だけ（0と11は触らない）
    const minR = 1;
    const maxR = 7; 

    let stack = [];
    state.map[centerR][1] = 1;
    stack.push({r: centerR, c: 1});

    const dirs = [{r:-2,c:0}, {r:2,c:0}, {r:0,c:-2}, {r:0,c:2}];

    while (stack.length > 0) {
        let curr = stack[stack.length - 1];
        let neighbors = [];
        let shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);

        for (let d of shuffledDirs) {
            let nr = curr.r + d.r;
            let nc = curr.c + d.c;
            
            // 境界チェック: 上下1マス(0, 11)を絶対に通路にしない
            if (nr >= minR && nr <= maxR && nc >= 1 && nc <= CONFIG.cols - 2 && state.map[nr][nc] === 0) {
                neighbors.push({r: nr, c: nc, dr: d.r, dc: d.c});
            }
        }

        if (neighbors.length > 0) {
            let next = neighbors[0];
            state.map[next.r][next.c] = 1;
            state.map[curr.r + next.dr/2][curr.c + next.dc/2] = 1;
            stack.push({r: next.r, c: next.c});
        } else {
            stack.pop();
        }
    }

    // --- ここからが「全壁」を防ぐ接続保証ロジック ---
    
    // 入口(左端)を開ける
    state.map[centerR][0] = 1;
    
    // 出口(右端)から左に向かって、通路にぶつかるまで穴を掘る
    state.map[centerR][CONFIG.cols - 1] = 1;
    for (let c = CONFIG.cols - 2; c >= 1; c--) {
        if (state.map[centerR][c] === 1) break; // 通路に接続したら終了
        state.map[centerR][c] = 1;
    }

    // ナビゲーションを更新
    rebuildNavMap();
}

/**
 * ゴールまでの歩数を計算（敵の移動ロジック用）
 */
function rebuildNavMap() {
    const distGrid = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill(Infinity));
    state.navMap = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill().map(() => []));

    const goal = state.endPoints[0];
    let queue = [{r: goal.r, c: goal.c, d: 0}];
    distGrid[goal.r][goal.c] = 0;

    const dirs = [{r:1,c:0}, {r:-1,c:0}, {r:0,c:1}, {r:0,c:-1}];
    
    while(queue.length > 0) {
        let curr = queue.shift();
        for(let dir of dirs) {
            let nr = curr.r + dir.r;
            let nc = curr.c + dir.c;
            if(nr >= 0 && nr < CONFIG.rows && nc >= 0 && nc < CONFIG.cols && 
               state.map[nr][nc] === 1 && distGrid[nr][nc] === Infinity) {
                distGrid[nr][nc] = curr.d + 1;
                queue.push({r: nr, c: nc, d: curr.d + 1});
            }
        }
    }

    for (let r = 0; r < CONFIG.rows; r++) {
        for (let c = 0; c < CONFIG.cols; c++) {
            if (state.map[r][c] === 1) {
                let neighbors = [];
                for(let dir of dirs) {
                    let nr = r + dir.r;
                    let nc = c + dir.c;
                    if(nr >= 0 && nr < CONFIG.rows && nc >= 0 && nc < CONFIG.cols && state.map[nr][nc] === 1) {
                        neighbors.push({r: nr, c: nc, dist: distGrid[nr][nc]});
                    }
                }
                neighbors.sort((a, b) => a.dist - b.dist);
                state.navMap[r][c] = neighbors.map(n => ({r: n.r, c: n.c}));
            }
        }
    }
}