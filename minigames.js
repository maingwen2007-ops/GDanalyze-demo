// Engine 6 bài Mini-game Thử thách nhanh (Timing, Spam click, Wave, Ship, UFO, Nhịp)
// Hỗ trợ Chuột, Chạm màn hình (Touch) và phím Space. Wave/Ship/UFO cho thử tối đa 3 lần, lấy quãng đường xa nhất.

(function () {
  let canvas, ctx;
  let activeMode = null;
  let animId = null;
  let isHolding = false;
  let gameState = 'idle'; // 'idle' | 'playing' | 'ended'
  let attemptsUsed = 0;
  let maxAttempts = 1;
  let currentScore = 0;
  let bestSessionScore = 0;
  let onScoreUpdateCallback = null;

  // Trạng thái vật lý của mini-game
  let player = { x: 90, y: 105, vy: 0, angle: 0, size: 16, trail: [] };
  let progress = 0; // 0 -> 100%
  let obstacles = [];
  let timingPlatforms = [];
  let timingOrbs = [];
  let timingPads = [];
  let orbBuffer = false;
  let onGround = true;
  let prismPulse = 0;
  let elapsedTime = 0;
  const GAME_DURATION = 15; // Thời lượng mặc định 15 giây
  const SPAM_CLICK_DURATION = 7; // Spam click rút ngắn còn 7 giây
  const WARMUP_SECONDS = 2.2; // Thời gian chuẩn bị tinh thần trước chướng ngại vật đầu tiên

  function getModeDuration(mode) {
    return mode === 'spam_click' ? SPAM_CLICK_DURATION : GAME_DURATION;
  }
  let rhythmBeats = [];
  let spamClicks = [];
  let lastFrameTime = 0;
  let difficultyTier = 'extreme'; // 'extreme' (Top Extreme Demon - Prismline) | 'standard'

  const TIER_PARAMS = {
    extreme: {
      badge: 'NÂNG CAO',
      timing: {
        speed: 295,
        progressRate: 13.5,
        jumpVy: -540,
        gravity: 2550,
        rotSpeed: 7.8,
        positions: [280, 480, 685, 895, 1105, 1315, 1525, 1735, 1950, 2165],
        widths: [24, 38, 26, 42, 26, 40, 44, 26, 38, 42],
        heights: [28, 32, 34, 30, 36, 34, 32, 36, 34, 36]
      },
      wave: {
        speed: 280,
        vy: 245,
        progressRate: 12.5,
        count: 16,
        startX: 260,
        spacing: 135,
        baseGap: 60,
        minGap: 46,
        width: 38
      },
      ship: {
        speed: 270,
        progressRate: 12.5,
        upAccel: -1080,
        downGravity: 940,
        maxVy: 280,
        count: 16,
        startX: 250,
        spacing: 120,
        baseGap: 60,
        minGap: 48,
        width: 64
      },
      ufo: {
        speed: 265,
        progressRate: 13,
        jumpVy: -345,
        gravity: 1450,
        count: 12,
        startX: 270,
        spacing: 160,
        gap: 64,
        width: 34
      },
      spam_click: {
        targetCps: 10.5,
        decay: 95
      },
      rhythm: {
        speed: 275,
        count: 12,
        hitWindow: 48,
        penaltyMult: 1.7,
        spacings: [145, 135, 150, 130, 145, 135, 150, 135, 145, 140, 145, 140]
      }
    },
    standard: {
      badge: 'NGƯỜI MỚI • TIÊU CHUẨN',
      timing: {
        speed: 235,
        progressRate: 15,
        jumpVy: -520,
        gravity: 2350,
        rotSpeed: 7.1,
        positions: [290, 495, 710, 930, 1160, 1395, 1635, 1880],
        widths: [22, 34, 22, 34, 22, 34, 22, 34],
        heights: [26, 28, 28, 28, 30, 32, 32, 32]
      },
      wave: {
        speed: 225,
        vy: 190,
        progressRate: 14,
        count: 12,
        startX: 260,
        spacing: 150,
        baseGap: 68,
        minGap: 54,
        width: 40
      },
      ship: {
        speed: 220,
        progressRate: 14,
        upAccel: -980,
        downGravity: 860,
        maxVy: 250,
        count: 14,
        startX: 250,
        spacing: 135,
        baseGap: 76,
        minGap: 70,
        width: 68
      },
      ufo: {
        speed: 220,
        progressRate: 14,
        jumpVy: -330,
        gravity: 1320,
        count: 10,
        startX: 280,
        spacing: 185,
        gap: 78,
        width: 32
      },
      spam_click: {
        targetCps: 8.0,
        decay: 75
      },
      rhythm: {
        speed: 210,
        count: 10,
        hitWindow: 62,
        penaltyMult: 1.2,
        spacings: Array(10).fill(155)
      }
    }
  };

  const MODE_CONFIG = {
    timing: {
      title: 'Bài test 1: Timing — Prismline Map (Bục khối, Jump Pad & Orb)',
      maxAttempts: 3,
      hint: 'Nhấn Chuột / Space để nhảy lên bục khối Prism và bấm đúng nhịp các vòng Orb vàng/hồng trên không!'
    },
    spam_click: {
      title: 'Bài test 2: Spam click (Tốc độ nhấp CPS cao & giữ tâm)',
      maxAttempts: 1,
      hint: 'Nhấp Chuột / Space liên tục thật nhanh trong 7 giây để giữ năng lượng ở mức tối đa!'
    },
    wave: {
      title: 'Bài test 3: Wave (Giữ để bay chéo lên 45°, nhả để lao xuống 45°)',
      maxAttempts: 3,
      hint: 'Tối đa 3 lần thử — điểm lấy theo quãng đường xa nhất (0-100%). Giữ Chuột/Space để bay lên!'
    },
    ship: {
      title: 'Bài test 4: Ship (Giữ thăng bằng Straight Fly qua hành lang)',
      maxAttempts: 3,
      hint: 'Tối đa 3 lần thử — nhấp nhả nhịp nhàng để giữ tàu bay giữa khe hẹp.'
    },
    ufo: {
      title: 'Bài test 5: UFO (Nhảy bậc thang trên không qua cột chắn)',
      maxAttempts: 3,
      hint: 'Tối đa 3 lần thử — mỗi cú click giúp UFO nảy lên một nhịp trên không.'
    },
    rhythm: {
      title: 'Bài test 6: Nhịp / Rhythm (Bấm đúng tâm vòng nhịp âm nhạc)',
      maxAttempts: 1,
      hint: 'Nhấn Chuột / Space đúng khoảnh khắc nốt nhạc chạm vào vạch vàng bên trái!'
    }
  };

  function generateMap(mode) {
    obstacles = [];
    timingPlatforms = [];
    timingOrbs = [];
    timingPads = [];
    orbBuffer = false;
    onGround = true;
    prismPulse = 0;
    elapsedTime = 0;
    rhythmBeats = [];
    spamClicks = [];
    player.trail = [];
    player.angle = 0;
    progress = 0;
    currentScore = 0;

    const p = TIER_PARAMS[difficultyTier][mode];
    const activeSeconds = GAME_DURATION - WARMUP_SECONDS;

    if (mode === 'timing') {
      player.y = 164;
      player.vy = 0;
      const sx = p.speed / 260;
      const spH = difficultyTier === 'extreme' ? 28 : 24;
      const leadX = Math.round(player.x + p.speed * WARMUP_SECONDS);
      const loopLen = Math.round(1860 * sx);
      const loops = Math.max(2, Math.ceil((p.speed * activeSeconds) / loopLen));

      for (let loopIdx = 0; loopIdx < loops; loopIdx++) {
        const base = leadX + loopIdx * loopLen;
        const X = (v) => base + Math.round(v * sx);

        // Đoạn 1: Mở đầu Prismline — gai đơn + bục Prism nâng cao
        obstacles.push({ x: X(0), y: 176, w: 22, h: spH, color: '#00f0ff' });
        timingPlatforms.push({ x: X(140), y: 146, w: Math.round(110 * sx), h: 30, hue: '#00f0ff' });
        obstacles.push({ x: X(270), y: 176, w: 22, h: spH, color: '#a855f7' });

        // Đoạn 2: Hố gai + Yellow Orb timing trên không
        obstacles.push({ x: X(395), y: 176, w: 22, h: spH, color: '#ff2ad4' });
        obstacles.push({ x: X(422), y: 176, w: 22, h: spH, color: '#ff2ad4' });
        obstacles.push({ x: X(449), y: 176, w: 22, h: spH, color: '#ff2ad4' });
        timingOrbs.push({ x: X(442), y: 126, r: 13, type: 'yellow', used: false });

        // Đoạn 3: Yellow Jump Pad bật lên trụ Prism cao + nhảy qua gai trên bục
        timingPads.push({ x: X(590), y: 176, w: 28, h: 7, used: false });
        timingPlatforms.push({ x: X(675), y: 118, w: Math.round(165 * sx), h: 58, hue: '#ff2ad4' });
        obstacles.push({ x: X(752), y: 118, w: 20, h: spH - 2, color: '#00f0ff' });

        // Đoạn 4: Bậc thang hạ xuống + cụm gai
        timingPlatforms.push({ x: X(905), y: 146, w: Math.round(105 * sx), h: 30, hue: '#38bdf8' });
        obstacles.push({ x: X(1045), y: 176, w: 22, h: spH, color: '#a855f7' });
        if (difficultyTier === 'extreme') {
          obstacles.push({ x: X(1068), y: 176, w: 20, h: spH, color: '#ff2ad4' });
        }

        // Đoạn 5: Chuỗi Pink Orb -> Yellow Orb đặc trưng Prismline qua thảm gai
        for (let k = 0; k < 6; k++) {
          obstacles.push({
            x: X(1185) + k * 25,
            y: 176,
            w: 22,
            h: spH,
            color: k % 2 === 0 ? '#00f0ff' : '#ff2ad4'
          });
        }
        timingOrbs.push({ x: X(1230), y: 132, r: 13, type: 'pink', used: false });
        timingOrbs.push({ x: X(1320), y: 112, r: 13, type: 'yellow', used: false });
        timingPlatforms.push({ x: X(1395), y: 138, w: Math.round(125 * sx), h: 38, hue: '#a855f7' });

        // Đoạn 6: Finale — Orb vàng + gai chốt
        obstacles.push({ x: X(1565), y: 176, w: 22, h: spH, color: '#00f0ff' });
        obstacles.push({ x: X(1592), y: 176, w: 22, h: spH, color: '#ff2ad4' });
        timingOrbs.push({ x: X(1585), y: 124, r: 13, type: 'yellow', used: false });
        obstacles.push({ x: X(1735), y: 176, w: 22, h: spH, color: '#00f0ff' });
      }
    } else if (mode === 'wave') {
      player.y = 105;
      player.vy = 0;
      const startX = Math.round(player.x + p.speed * WARMUP_SECONDS);
      const count = Math.ceil((p.speed * (activeSeconds + 0.4)) / p.spacing);
      for (let i = 0; i < count; i++) {
        const x = startX + i * p.spacing;
        const center = difficultyTier === 'extreme'
          ? 62 + ((i * 43) % 82)
          : 68 + ((i * 33) % 72);
        const gap = Math.max(p.minGap, p.baseGap - i * 0.5);
        obstacles.push({ x, w: p.width, topH: center - gap / 2, botY: center + gap / 2 });
      }
    } else if (mode === 'ship') {
      player.y = 105;
      player.vy = 0;
      const startX = Math.round(player.x + p.speed * WARMUP_SECONDS);
      const count = Math.ceil((p.speed * (activeSeconds + 0.4)) / p.spacing);
      for (let i = 0; i < count; i++) {
        const x = startX + i * p.spacing;
        const center = difficultyTier === 'extreme'
          ? 96 + Math.sin(i * 0.85) * 32
          : 92 + Math.sin(i * 0.7) * 26;
        const gap = Math.max(p.minGap, p.baseGap - i * 0.35);
        obstacles.push({ x, w: p.width, topH: center - gap / 2, botY: center + gap / 2 });
      }
    } else if (mode === 'ufo') {
      player.y = 100;
      player.vy = 0;
      const startX = Math.round(player.x + p.speed * WARMUP_SECONDS);
      const count = Math.ceil((p.speed * (activeSeconds + 0.4)) / p.spacing);
      for (let i = 0; i < count; i++) {
        const x = startX + i * p.spacing;
        const center = difficultyTier === 'extreme'
          ? 64 + ((i * 45) % 78)
          : 68 + ((i * 41) % 68);
        obstacles.push({ x, w: p.width, topH: center - p.gap / 2, botY: center + p.gap / 2 });
      }
    } else if (mode === 'rhythm') {
      let curX = Math.round(110 + p.speed * WARMUP_SECONDS);
      const maxX = Math.round(110 + p.speed * (GAME_DURATION - 0.3));
      let idx = 0;
      while (curX < maxX) {
        rhythmBeats.push({
          x: curX,
          hit: false,
          missed: false,
          accuracy: 0
        });
        curX += p.spacings[idx % p.spacings.length];
        idx++;
      }
    }
  }

  function triggerSingleAction() {
    if (!activeMode) return;
    if (gameState !== 'playing') {
      startAttempt();
      return;
    }

    const p = TIER_PARAMS[difficultyTier][activeMode];

    if (activeMode === 'timing') {
      orbBuffer = true;
      // Kiểm tra bấm trúng Orb ngay lập tức nếu đang ở gần
      for (const orb of timingOrbs) {
        if (!orb.used && Math.hypot(player.x - orb.x, player.y - orb.y) <= 36) {
          orb.used = true;
          orbBuffer = false;
          onGround = false;
          player.vy = orb.type === 'pink' ? p.jumpVy * 0.84 : p.jumpVy * 1.04;
          return;
        }
      }
      if (onGround) {
        onGround = false;
        orbBuffer = false;
        player.vy = p.jumpVy;
      }
    } else if (activeMode === 'ufo') {
      player.vy = p.jumpVy;
    } else if (activeMode === 'spam_click') {
      spamClicks.push(performance.now());
      player.y = Math.max(30, player.y - 11);
    } else if (activeMode === 'rhythm') {
      // Tìm nốt gần vạch targetX = 110 nhất
      const targetX = 110;
      let nearest = null;
      let minDist = 999;
      rhythmBeats.forEach((b) => {
        if (!b.hit && !b.missed) {
          const d = Math.abs(b.x - targetX);
          if (d < minDist) {
            minDist = d;
            nearest = b;
          }
        }
      });
      if (nearest && minDist < p.hitWindow) {
        nearest.hit = true;
        nearest.accuracy = Math.max(25, Math.round(100 - minDist * p.penaltyMult));
      }
    }
  }

  function startAttempt() {
    if (!activeMode) return;
    if (attemptsUsed >= maxAttempts) {
      attemptsUsed = 0;
      bestSessionScore = 0;
    }
    attemptsUsed++;
    generateMap(activeMode);
    gameState = 'playing';
    lastFrameTime = performance.now();
    updateHeaderUI();
  }

  function finishAttempt(finalScore) {
    gameState = 'ended';
    currentScore = Math.max(0, Math.min(100, Math.round(finalScore)));
    if (currentScore > bestSessionScore) {
      bestSessionScore = currentScore;
    }
    if (onScoreUpdateCallback && activeMode) {
      onScoreUpdateCallback(activeMode, bestSessionScore);
    }
    updateHeaderUI();
  }

  function updateHeaderUI() {
    const metaEl = document.getElementById('minigame-attempt-info');
    if (metaEl && activeMode) {
      metaEl.textContent = `Lượt thử: ${attemptsUsed}/${maxAttempts} • Điểm cao nhất phiên: ${bestSessionScore}/100`;
    }
    const badgeEl = document.getElementById('minigame-tier-badge');
    if (badgeEl) {
      badgeEl.textContent = TIER_PARAMS[difficultyTier].badge;
      badgeEl.classList.toggle('extreme', difficultyTier === 'extreme');
    }
  }

  function updatePhysics(dt) {
    if (gameState !== 'playing') return;
    const p = TIER_PARAMS[difficultyTier][activeMode];
    const duration = getModeDuration(activeMode);
    elapsedTime += dt;
    progress = Math.min(100, (elapsedTime / duration) * 100);

    if (activeMode === 'timing') {
      const speed = p.speed * dt;
      prismPulse += dt * 4.5;
      const prevY = player.y;

      player.vy += p.gravity * dt;
      player.y += player.vy * dt;
      onGround = false;

      // Di chuyển toàn bộ thành phần map Prismline
      for (const plat of timingPlatforms) plat.x -= speed;
      for (const orb of timingOrbs) orb.x -= speed;
      for (const pad of timingPads) pad.x -= speed;
      for (const ob of obstacles) ob.x -= speed;

      // Jump Pad vàng tự động bật cao
      for (const pad of timingPads) {
        if (
          !pad.used &&
          player.x + 11 > pad.x &&
          player.x - 11 < pad.x + pad.w &&
          player.y + 12 >= pad.y - pad.h - 4 &&
          player.y - 12 <= pad.y
        ) {
          pad.used = true;
          player.vy = p.jumpVy * 1.24;
          onGround = false;
        }
      }

      // Orb buffer trên không (giống Geometry Dash)
      if (orbBuffer) {
        for (const orb of timingOrbs) {
          if (!orb.used && Math.hypot(player.x - orb.x, player.y - orb.y) <= 36) {
            orb.used = true;
            orbBuffer = false;
            onGround = false;
            player.vy = orb.type === 'pink' ? p.jumpVy * 0.84 : p.jumpVy * 1.04;
            break;
          }
        }
      }

      // Va chạm bục khối Prism (đứng trên mặt bục an toàn, đâm ngang cạnh trước thì thua)
      for (const plat of timingPlatforms) {
        if (player.x + 11 > plat.x && player.x - 11 < plat.x + plat.w) {
          if (prevY + 12 <= plat.y + 10 && player.vy >= 0 && player.y + 12 >= plat.y) {
            player.y = plat.y - 12;
            player.vy = 0;
            onGround = true;
          } else if (player.y + 10 > plat.y + 10 && player.y - 10 < plat.y + plat.h && player.x + 10 > plat.x + 4) {
            finishAttempt(progress);
            return;
          }
        }
      }

      // Mặt đất (y = 176 -> tâm Cube ở 164)
      if (player.y >= 164) {
        player.y = 164;
        player.vy = 0;
        onGround = true;
      }

      if (onGround) {
        player.angle = Math.round(player.angle / (Math.PI / 2)) * (Math.PI / 2);
        if (isHolding) {
          onGround = false;
          orbBuffer = false;
          player.vy = p.jumpVy;
        }
      } else {
        player.angle += p.rotSpeed * dt;
      }

      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 26) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= speed));

      // Hitbox gai pha lê (thu gọn nhẹ giống Geometry Dash)
      for (const ob of obstacles) {
        const baseY = ob.y || 176;
        if (
          player.x + 8 > ob.x + 4 &&
          player.x - 8 < ob.x + ob.w - 4 &&
          player.y + 10 > baseY - ob.h + 7 &&
          player.y - 10 < baseY
        ) {
          finishAttempt(progress);
          return;
        }
      }
      currentScore = Math.round(progress);
      if (elapsedTime >= GAME_DURATION) finishAttempt(100);
    } else if (activeMode === 'wave') {
      const speed = p.speed * dt;
      player.vy = isHolding ? -p.vy : p.vy;
      player.y += player.vy * dt;
      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 35) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= speed));

      if (player.y < 14 || player.y > 196) {
        finishAttempt(progress);
        return;
      }
      for (const ob of obstacles) {
        ob.x -= speed;
        if (player.x + 8 > ob.x && player.x - 8 < ob.x + ob.w) {
          if (player.y - 7 < ob.topH || player.y + 7 > ob.botY) {
            finishAttempt(progress);
            return;
          }
        }
      }
      currentScore = Math.round(progress);
      if (elapsedTime >= GAME_DURATION) finishAttempt(100);
    } else if (activeMode === 'ship') {
      const speed = p.speed * dt;
      player.vy += (isHolding ? p.upAccel : p.downGravity) * dt;
      player.vy = Math.max(-p.maxVy, Math.min(p.maxVy, player.vy));
      player.y += player.vy * dt;
      player.angle = Math.atan2(player.vy, p.speed) * 0.85;
      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 28) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= speed));

      if (player.y < 14 || player.y > 196) {
        finishAttempt(progress);
        return;
      }
      for (const ob of obstacles) {
        ob.x -= speed;
        if (player.x + 10 > ob.x && player.x - 10 < ob.x + ob.w) {
          if (player.y - 9 < ob.topH || player.y + 9 > ob.botY) {
            finishAttempt(progress);
            return;
          }
        }
      }
      currentScore = Math.round(progress);
      if (elapsedTime >= GAME_DURATION) finishAttempt(100);
    } else if (activeMode === 'ufo') {
      const speed = p.speed * dt;
      player.vy += p.gravity * dt;
      player.y += player.vy * dt;

      if (player.y < 14 || player.y > 196) {
        finishAttempt(progress);
        return;
      }
      for (const ob of obstacles) {
        ob.x -= speed;
        if (player.x + 10 > ob.x && player.x - 10 < ob.x + ob.w) {
          if (player.y - 9 < ob.topH || player.y + 9 > ob.botY) {
            finishAttempt(progress);
            return;
          }
        }
      }
      currentScore = Math.round(progress);
      if (elapsedTime >= GAME_DURATION) finishAttempt(100);
    } else if (activeMode === 'spam_click') {
      const now = performance.now();
      spamClicks = spamClicks.filter((t) => now - t < 1000);
      const cps = spamClicks.length;
      const liveScore = Math.min(100, Math.round((cps / p.targetCps) * 100));
      currentScore = elapsedTime < WARMUP_SECONDS ? Math.max(currentScore, liveScore) : liveScore;
      if (currentScore > bestSessionScore) bestSessionScore = currentScore;
      player.y = Math.min(170, player.y + p.decay * dt);
      if (elapsedTime >= duration) {
        finishAttempt(Math.max(currentScore, bestSessionScore));
      }
    } else if (activeMode === 'rhythm') {
      const speed = p.speed * dt;
      rhythmBeats.forEach((b) => {
        b.x -= speed;
        if (b.x < 50 && !b.hit) {
          b.missed = true;
        }
      });
      const doneBeats = rhythmBeats.filter((b) => b.hit || b.missed);
      const totalAcc = rhythmBeats.reduce((acc, b) => acc + (b.hit ? b.accuracy : 0), 0);
      currentScore = doneBeats.length > 0 ? Math.round(totalAcc / doneBeats.length) : 0;
      if (elapsedTime >= GAME_DURATION) {
        const finalAcc = rhythmBeats.length > 0 ? Math.round(totalAcc / rhythmBeats.length) : 0;
        finishAttempt(finalAcc);
      }
    }
  }

  function drawGDCube(cx, cy, size, angle) {
    const half = size / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Thân Cube xanh lá viền đen chuẩn icon/logo Geometry Dash
    ctx.fillStyle = '#6dff00';
    ctx.strokeStyle = '#09050f';
    ctx.lineWidth = Math.max(1.5, size * 0.08);
    ctx.fillRect(-half, -half, size, size);
    ctx.strokeRect(-half, -half, size, size);

    // Hai mắt vuông và miệng ngang màu xanh cyan viền đen
    ctx.fillStyle = '#00f0ff';
    const eyeSize = size * 0.2;
    const eyeY = -size * 0.22;
    const eyeOffsetX = size * 0.22;

    // Mắt trái & mắt phải
    ctx.fillRect(-eyeOffsetX - eyeSize / 2, eyeY, eyeSize, eyeSize);
    ctx.strokeRect(-eyeOffsetX - eyeSize / 2, eyeY, eyeSize, eyeSize);
    ctx.fillRect(eyeOffsetX - eyeSize / 2, eyeY, eyeSize, eyeSize);
    ctx.strokeRect(eyeOffsetX - eyeSize / 2, eyeY, eyeSize, eyeSize);

    // Miệng ngang
    const mouthW = size * 0.64;
    const mouthH = size * 0.16;
    const mouthY = size * 0.12;
    ctx.fillRect(-mouthW / 2, mouthY, mouthW, mouthH);
    ctx.strokeRect(-mouthW / 2, mouthY, mouthW, mouthH);

    ctx.restore();
  }

  function drawGDShip(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Cube mini ngồi trên bệ lái Ship
    drawGDCube(1, -6, 11, 0);

    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09050f';

    // Thân tàu xanh lá (#6dff00) viền đen theo mẫu GDTS_Ship
    ctx.fillStyle = '#6dff00';

    // Ống xả động cơ phía sau
    ctx.fillRect(-16, -1, 3, 7);
    ctx.strokeRect(-16, -1, 3, 7);

    // Đuôi loe phía sau
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-7, 8);
    ctx.lineTo(-13, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Khoang giữa
    ctx.fillRect(-7, 0, 11, 8);
    ctx.strokeRect(-7, 0, 11, 8);

    // Mũi tàu vát nhọn phía trước
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(16, 2);
    ctx.lineTo(16, 6);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bệ ngồi / cánh chữ L màu xanh cyan (#00f0ff) viền đen phía trên
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(-9, -11);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-6, -5);
    ctx.lineTo(11, -3);
    ctx.lineTo(11, 0);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function renderArena() {
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Lưới nền kiểu Geometry Dash
    ctx.strokeStyle = 'rgba(166, 110, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Thanh tiến độ 15 giây phía trên
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(20, 10, W - 125, 6);
    const progGrad = ctx.createLinearGradient(20, 0, W - 105, 0);
    progGrad.addColorStop(0, '#00f0ff');
    progGrad.addColorStop(0.5, '#a66eff');
    progGrad.addColorStop(1, '#ff2ad4');
    ctx.fillStyle = progGrad;
    ctx.fillRect(20, 10, ((W - 125) * Math.min(100, progress)) / 100, 6);

    const duration = getModeDuration(activeMode);
    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.min(duration, elapsedTime).toFixed(1)}s / ${duration}s`, W - 20, 17);
    ctx.textAlign = 'left';

    if (activeMode === 'timing') {
      // Nền glow Prismline chuyển sắc theo tiến độ + tia sáng lăng kính
      const pulse = 0.5 + 0.5 * Math.sin(prismPulse);
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, `rgba(14, 24, 58, ${0.42 + pulse * 0.12})`);
      bgGrad.addColorStop(0.5, `rgba(76, 20, 128, ${0.34 + pulse * 0.12})`);
      bgGrad.addColorStop(1, `rgba(130, 18, 98, ${0.32 + pulse * 0.1})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 22, W, 154);

      // Tia sáng chéo kiểu lăng kính (Prismline deco)
      ctx.save();
      ctx.globalAlpha = 0.1 + pulse * 0.06;
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 220 - (elapsedTime * 75) % 220) + W) % (W + 220) - 110;
        ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff2ad4';
        ctx.beginPath();
        ctx.moveTo(bx, 22);
        ctx.lineTo(bx + 36, 22);
        ctx.lineTo(bx - 24, 176);
        ctx.lineTo(bx - 60, 176);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Mặt đất glow Prismline
      ctx.fillStyle = '#140a29';
      ctx.fillRect(0, 176, W, H - 176);
      const floorGrad = ctx.createLinearGradient(0, 176, W, 176);
      floorGrad.addColorStop(0, '#00f0ff');
      floorGrad.addColorStop(0.5, '#a855f7');
      floorGrad.addColorStop(1, '#ff2ad4');
      ctx.strokeStyle = floorGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 176);
      ctx.lineTo(W, 176);
      ctx.stroke();

      // Bục khối Prism nâng cao
      timingPlatforms.forEach((plat) => {
        if (plat.x + plat.w < -20 || plat.x > W + 20) return;
        ctx.save();
        ctx.fillStyle = 'rgba(13, 8, 30, 0.92)';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Đường chéo ánh sáng bên trong khối Prism
        ctx.fillStyle = plat.hue === '#ff2ad4' ? 'rgba(255, 42, 212, 0.16)' : 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y);
        ctx.lineTo(plat.x + plat.w * 0.65, plat.y);
        ctx.lineTo(plat.x + plat.w * 0.35, plat.y + plat.h);
        ctx.lineTo(plat.x, plat.y + plat.h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = plat.hue || '#00f0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

        // Viền sáng mép trên
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(plat.x + 2, plat.y, plat.w - 4, 2);
        ctx.restore();
      });

      // Jump Pad vàng phát sáng
      timingPads.forEach((pad) => {
        if (pad.x + pad.w < -20 || pad.x > W + 20) return;
        ctx.save();
        ctx.fillStyle = pad.used ? 'rgba(255, 230, 0, 0.45)' : '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pad.x + pad.w / 2, pad.y, pad.w / 2, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Jump Orbs (Vàng & Hồng) phát sáng
      timingOrbs.forEach((orb) => {
        if (orb.x < -30 || orb.x > W + 30) return;
        const orbColor = orb.type === 'pink' ? '#ff38d4' : '#ffe600';
        const ringR = orb.r + 3 + Math.sin(prismPulse * 1.4) * 2;
        ctx.save();
        ctx.globalAlpha = orb.used ? 0.35 : 1;
        ctx.strokeStyle = orbColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, ringR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = orbColor;
        ctx.shadowColor = orbColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r - 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Gai pha lê phát sáng kiểu Prismline
      obstacles.forEach((ob) => {
        if (ob.x + ob.w < -20 || ob.x > W + 20) return;
        const baseY = ob.y || 176;
        ctx.save();
        ctx.fillStyle = '#090414';
        ctx.strokeStyle = ob.color || '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ob.x, baseY);
        ctx.lineTo(ob.x + ob.w / 2, baseY - ob.h);
        ctx.lineTo(ob.x + ob.w, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lõi pha lê sáng bên trong gai
        ctx.fillStyle = ob.color || '#00f0ff';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(ob.x + ob.w * 0.28, baseY - 2);
        ctx.lineTo(ob.x + ob.w / 2, baseY - ob.h * 0.62);
        ctx.lineTo(ob.x + ob.w * 0.72, baseY - 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Vệt sáng nét đứt Prismline
      if (player.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        player.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();
      }

      // Cube chuẩn icon Geometry Dash
      drawGDCube(player.x, player.y, 24, player.angle);
    } else if (activeMode === 'wave' || activeMode === 'ship' || activeMode === 'ufo') {
      // Chướng ngại vật trên & dưới
      ctx.fillStyle = 'rgba(166, 110, 255, 0.35)';
      ctx.strokeStyle = '#a66eff';
      obstacles.forEach((ob) => {
        ctx.fillRect(ob.x, 0, ob.w, ob.topH);
        ctx.strokeRect(ob.x, 0, ob.w, ob.topH);
        ctx.fillRect(ob.x, ob.botY, ob.w, H - ob.botY);
        ctx.strokeRect(ob.x, ob.botY, ob.w, H - ob.botY);
      });

      // Vệt sáng (Trail) cho Wave & Ship
      if (player.trail.length > 1) {
        ctx.save();
        if (activeMode === 'ship') {
          ctx.strokeStyle = '#ff2ad4';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([7, 6]);
        } else {
          ctx.strokeStyle = '#ff9900';
          ctx.lineWidth = 3;
        }
        ctx.beginPath();
        player.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();

        // Hạt lửa vuông hồng/cam phía sau động cơ Ship
        if (activeMode === 'ship') {
          for (let i = Math.max(0, player.trail.length - 8); i < player.trail.length; i += 2) {
            const pt = player.trail[i];
            const ratio = i / player.trail.length;
            ctx.fillStyle = i % 4 === 0 ? '#ff9900' : '#ff2ad4';
            ctx.globalAlpha = 0.35 + ratio * 0.55;
            ctx.fillRect(pt.x - 4, pt.y + ((i % 3) - 1) * 3, 4, 4);
          }
          ctx.globalAlpha = 1;
        }
      }

      // Icon nhân vật
      if (activeMode === 'ship') {
        drawGDShip(player.x, player.y, player.angle);
      } else {
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(player.x + 12, player.y);
        ctx.lineTo(player.x - 10, player.y - 9);
        ctx.lineTo(player.x - 10, player.y + 9);
        ctx.closePath();
        ctx.fill();
      }
    } else if (activeMode === 'spam_click') {
      ctx.fillStyle = '#cbbce6';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(`Tốc độ nhấp hiện tại: ${spamClicks.length} CPS  →  Điểm: ${currentScore}/100`, 30, 65);

      // Cột năng lượng CPS
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(30, 90, W - 60, 36);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(30, 90, ((W - 60) * currentScore) / 100, 36);
    } else if (activeMode === 'rhythm') {
      // Vạch căn nhịp
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(110, 30);
      ctx.lineTo(110, H - 30);
      ctx.stroke();

      rhythmBeats.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, H / 2, 16, 0, Math.PI * 2);
        ctx.fillStyle = b.hit ? '#34d399' : b.missed ? '#fb7185' : '#a66eff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // Overlay hướng dẫn khi chưa bắt đầu hoặc vừa kết thúc
    if (gameState !== 'playing') {
      ctx.fillStyle = 'rgba(11, 5, 23, 0.76)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.textAlign = 'center';
      const msg =
        gameState === 'idle'
          ? 'Nhấn CHUỘT, CHẠM hoặc phím SPACE để bắt đầu bài test!'
          : `Kết quả lượt này: ${currentScore}/100 (Cao nhất: ${bestSessionScore}/100) — Nhấn để thử lại!`;
      ctx.fillText(msg, W / 2, H / 2 + 5);
      ctx.textAlign = 'left';
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000 || 0.016);
    lastFrameTime = now;
    updatePhysics(dt);
    renderArena();
    animId = requestAnimationFrame(loop);
  }

  window.GDMiniGames = {
    init(onScoreUpdate) {
      onScoreUpdateCallback = onScoreUpdate;
      canvas = document.getElementById('minigame-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');

      const wrap = document.getElementById('minigame-canvas-wrap');
      const downHandler = (e) => {
        e.preventDefault();
        isHolding = true;
        triggerSingleAction();
      };
      const upHandler = () => {
        isHolding = false;
        orbBuffer = false;
      };

      wrap.addEventListener('mousedown', downHandler);
      window.addEventListener('mouseup', upHandler);
      wrap.addEventListener('touchstart', downHandler, { passive: false });
      window.addEventListener('touchend', upHandler);

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && activeMode && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (!isHolding) {
            isHolding = true;
            triggerSingleAction();
          }
        }
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
          isHolding = false;
          orbBuffer = false;
        }
      });

      const extremeBtn = document.getElementById('qc-tier-extreme');
      const standardBtn = document.getElementById('qc-tier-standard');
      if (extremeBtn) {
        extremeBtn.addEventListener('click', () => this.setDifficultyTier('extreme'));
      }
      if (standardBtn) {
        standardBtn.addEventListener('click', () => this.setDifficultyTier('standard'));
      }
      updateHeaderUI();
    },

    setDifficultyTier(tier) {
      if (tier !== 'extreme' && tier !== 'standard') return;
      difficultyTier = tier;
      const extremeBtn = document.getElementById('qc-tier-extreme');
      const standardBtn = document.getElementById('qc-tier-standard');
      if (extremeBtn) extremeBtn.classList.toggle('active', tier === 'extreme');
      if (standardBtn) standardBtn.classList.toggle('active', tier === 'standard');

      if (activeMode) {
        attemptsUsed = 0;
        gameState = 'idle';
        generateMap(activeMode);
      }
      updateHeaderUI();
    },

    openMode(mode, existingScore) {
      if (!MODE_CONFIG[mode]) return;
      activeMode = mode;
      const cfg = MODE_CONFIG[mode];
      maxAttempts = cfg.maxAttempts;
      attemptsUsed = 0;
      bestSessionScore = existingScore || 0;
      gameState = 'idle';

      const drawer = document.getElementById('minigame-drawer');
      const titleEl = document.getElementById('minigame-title');
      const hintEl = document.getElementById('minigame-hint');

      if (drawer) drawer.classList.add('open');
      if (titleEl) titleEl.textContent = cfg.title;
      if (hintEl) hintEl.textContent = cfg.hint;

      if (canvas) {
        canvas.width = canvas.clientWidth || 720;
        canvas.height = canvas.clientHeight || 210;
      }

      generateMap(mode);
      updateHeaderUI();

      if (animId) cancelAnimationFrame(animId);
      lastFrameTime = performance.now();
      animId = requestAnimationFrame(loop);
    },

    close() {
      activeMode = null;
      if (animId) cancelAnimationFrame(animId);
      const drawer = document.getElementById('minigame-drawer');
      if (drawer) drawer.classList.remove('open');
    }
  };
})();
