// Engine 6 bài Mini-game theo chuẩn "The Skill Tester" (XcreatorGoal - ID 127401310)
// Cơ chế Noclip-Accuracy thực thụ: Chạy trọn vẹn lượt test (15s; Spam click 7s), đo TOTAL ACCURACY (%)
// và chấm huy chương 16 sao: PERFECT (100%), S+ (97-99%), S, A, B, C, D, F.

(function () {
  let canvas, ctx;
  let activeMode = null;
  let animId = null;
  let isHolding = false;
  let gameState = 'idle'; // 'idle' | 'playing' | 'ended'
  let attemptsUsed = 0;
  let maxAttempts = 3;
  let currentScore = 100;
  let bestSessionScore = 0;
  let onScoreUpdateCallback = null;

  // Trạng thái vật lý & độ chính xác kiểu The Skill Tester
  let player = { x: 95, y: 105, vy: 0, angle: 0, size: 22, trail: [], particles: [] };
  let progress = 0;
  let elapsedTime = 0;
  let accuracyFloat = 100;
  let isColliding = false;
  let onGround = true;
  let bgScrollX = 0;

  let timingBlocks = [];
  let timingSpikes = [];
  let waveNodes = []; // Đỉnh đường hầm chéo 45° của Wave
  let corridorGates = []; // Cổng Straight Fly (Ship) & Cột xen kẽ (UFO)
  let rhythmBeats = [];
  let spamClicks = [];

  let lastFrameTime = 0;
  let difficultyTier = 'extreme'; // 'extreme' (Nâng cao) | 'standard' (Tiêu chuẩn)

  const GAME_DURATION = 15;
  const SPAM_CLICK_DURATION = 7;
  const WARMUP_SECONDS = 2.0;
  const CEIL_Y = 26;
  const FLOOR_Y = 184;

  function getModeDuration(mode) {
    return mode === 'spam_click' ? SPAM_CLICK_DURATION : GAME_DURATION;
  }

  function getSkillRank(score) {
    const s = Math.round(score);
    if (s >= 100) return { label: 'PERFECT', short: 'P', color: '#ff00ff', ringBg: '#070b24' };
    if (s >= 97) return { label: 'S+', short: 'S+', color: '#ff4d6d', ringBg: '#090b24' };
    if (s >= 92) return { label: 'S', short: 'S', color: '#fbbf24', ringBg: '#090b24' };
    if (s >= 84) return { label: 'A', short: 'A', color: '#22c55e', ringBg: '#090b24' };
    if (s >= 72) return { label: 'B', short: 'B', color: '#38bdf8', ringBg: '#090b24' };
    if (s >= 58) return { label: 'C', short: 'C', color: '#fb923c', ringBg: '#090b24' };
    if (s >= 42) return { label: 'D', short: 'D', color: '#94a3b8', ringBg: '#090b24' };
    return { label: 'F', short: 'F', color: '#ef4444', ringBg: '#090b24' };
  }

  const TIER_PARAMS = {
    extreme: {
      badge: 'NÂNG CAO',
      penaltyPerSec: 34,
      timing: { speed: 305, jumpVy: -545, gravity: 2700, rotSpeed: 8.5 },
      spam_click: { speed: 270, jumpVy: -165, gravity: 980, safeHalfGap: 30, targetCps: 9.5 },
      wave: { speed: 280, vy: 280, halfGap: 28 },
      ship: { speed: 275, upAccel: -1120, downGravity: 980, maxVy: 280, gap: 52 },
      ufo: { speed: 265, jumpVy: -355, gravity: 1480, gap: 58 },
      rhythm: { speed: 285, hitWindow: 46, missPenalty: 7.5, spacings: [140, 125, 145, 120, 135, 130, 150, 125] }
    },
    standard: {
      badge: 'TIÊU CHUẨN',
      penaltyPerSec: 25,
      timing: { speed: 240, jumpVy: -520, gravity: 2400, rotSpeed: 7.2 },
      spam_click: { speed: 230, jumpVy: -155, gravity: 840, safeHalfGap: 40, targetCps: 7.5 },
      wave: { speed: 230, vy: 230, halfGap: 38 },
      ship: { speed: 225, upAccel: -980, downGravity: 860, maxVy: 250, gap: 68 },
      ufo: { speed: 225, jumpVy: -335, gravity: 1340, gap: 72 },
      rhythm: { speed: 220, hitWindow: 58, missPenalty: 5.5, spacings: [155, 150, 160, 145, 155, 150] }
    }
  };

  const MODE_CONFIG = {
    timing: {
      title: 'Skill Tester 1: Cube Timing (Gai 3 & Trụ treo ngược)',
      maxAttempts: 3,
      hint: 'Nhấn Chuột / Space nhảy qua cụm gai 3 và luồn dưới trụ gai treo — va chạm sẽ trừ % Accuracy!'
    },
    spam_click: {
      title: 'Skill Tester 2: Spam Consistency (Giữ tâm hành lang gai 7s)',
      maxAttempts: 3,
      hint: 'Nhấp liên tục đều tay trong 7 giây để giữ nhân vật nằm giữa 2 hàng gai trên/dưới mà không mất Accuracy!'
    },
    wave: {
      title: 'Skill Tester 3: Wave Corridor (Đường hầm chéo 45° & vạch dẫn trắng)',
      maxAttempts: 3,
      hint: 'Giữ Chuột / Space để lên 45°, nhả để xuống 45° — bám sát đường dẫn trắng giữa hầm Wave!'
    },
    ship: {
      title: 'Skill Tester 4: Ship Straight Fly (Hành lang cụm 3 gai)',
      maxAttempts: 3,
      hint: 'Nhấp nhả nhịp nhàng để bay thẳng (Straight Fly) qua các cổng 3 gai mà không chạm cạnh!'
    },
    ufo: {
      title: 'Skill Tester 5: UFO Pillars (Cột gai trên/dưới xen kẽ)',
      maxAttempts: 3,
      hint: 'Căn nhịp nảy UFO luồn qua chuỗi cột gai nhô cao và rủ xuống xen kẽ liên hoàn!'
    },
    rhythm: {
      title: 'Skill Tester 6: Click Sync (Chuẩn xác tâm vòng nhịp)',
      maxAttempts: 3,
      hint: 'Nhấn Chuột / Space đúng khoảnh khắc tâm vòng Orb chạm vạch trắng để giữ 100% Accuracy (PERFECT)!'
    }
  };

  function generateMap(mode) {
    timingBlocks = [];
    timingSpikes = [];
    waveNodes = [];
    corridorGates = [];
    rhythmBeats = [];
    spamClicks = [];
    player.trail = [];
    player.particles = [];
    player.angle = 0;
    player.vy = 0;
    progress = 0;
    elapsedTime = 0;
    accuracyFloat = 100;
    currentScore = 100;
    isColliding = false;
    onGround = true;
    bgScrollX = 0;

    const p = TIER_PARAMS[difficultyTier][mode];
    const duration = getModeDuration(mode);
    const activeSec = duration - WARMUP_SECONDS;
    const leadX = Math.round(player.x + p.speed * WARMUP_SECONDS);

    if (mode === 'timing') {
      // Giống khung hình 0:02 của The Skill Tester: Cụm 3 gai sàn xen kẽ trụ lưới 1 ô treo từ trần có mũi gai ngược
      player.y = FLOOR_Y - 11;
      const sx = p.speed / 260;
      const patternLen = Math.round(1120 * sx);
      const loops = Math.max(3, Math.ceil((p.speed * (activeSec + 0.6)) / patternLen));

      for (let l = 0; l < loops; l++) {
        const base = leadX + l * patternLen;
        const X = (v) => base + Math.round(v * sx);

        // Cụm 1: 3 gai sàn -> khoảng đáp nhỏ -> 3 gai sàn + trụ treo có gai ngược phía sau
        for (let k = 0; k < 3; k++) {
          timingSpikes.push({ x: X(k * 23), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });
        }
        for (let k = 0; k < 3; k++) {
          timingSpikes.push({ x: X(145 + k * 23), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });
        }

        // Trụ lưới 1 ô treo từ trần xuống + gai ngược (giống hệt ảnh 0:02)
        const pillarW = 24;
        const pillarH = difficultyTier === 'extreme' ? 92 : 78;
        timingBlocks.push({ x: X(275), y: CEIL_Y, w: pillarW, h: pillarH });
        timingSpikes.push({ x: X(275), y: CEIL_Y + pillarH, w: pillarW, h: 22, dir: 'down' });

        // Gai đơn trên sàn + Trụ treo thứ hai
        timingSpikes.push({ x: X(365), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });
        timingBlocks.push({ x: X(455), y: CEIL_Y, w: pillarW, h: pillarH });
        timingSpikes.push({ x: X(455), y: CEIL_Y + pillarH, w: pillarW, h: 22, dir: 'down' });

        // Bục 1.0 trên sàn + nhảy qua cụm 2 gai
        timingBlocks.push({ x: X(590), y: FLOOR_Y - 28, w: Math.round(78 * sx), h: 28, walkable: true });
        timingSpikes.push({ x: X(695), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });
        timingSpikes.push({ x: X(718), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });

        // Trụ treo + gai đôi chốt vòng
        timingBlocks.push({ x: X(845), y: CEIL_Y, w: pillarW, h: pillarH - 6 });
        timingSpikes.push({ x: X(845), y: CEIL_Y + pillarH - 6, w: pillarW, h: 22, dir: 'down' });
        timingSpikes.push({ x: X(955), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });
        if (difficultyTier === 'extreme') {
          timingSpikes.push({ x: X(978), y: FLOOR_Y, w: 22, h: 25, dir: 'up' });
        }
      }
    } else if (mode === 'spam_click') {
      player.y = 105;
    } else if (mode === 'wave') {
      // Đường hầm chéo 45° liên hoàn giống hệt khung hình Wave của The Skill Tester (yt_2.jpg)
      player.y = 105;
      const slope = p.vy / p.speed; // = 1.0 (đúng góc 45°)
      let curX = 0;
      let curY = 105;
      waveNodes.push({ x: 0, y: 105 });
      waveNodes.push({ x: leadX - 40, y: 105 });
      curX = leadX - 40;

      // Dãy độ cao mục tiêu tạo hình chữ M / W giống video
      const targetYs = [64, 132, 92, 146, 70, 98, 72, 100, 68, 148, 86, 138, 66, 118, 74, 142, 105];
      const maxX = Math.round(player.x + p.speed * (duration + 1));
      let idx = 0;
      while (curX < maxX) {
        const nextY = targetYs[idx % targetYs.length];
        const dy = nextY - curY;
        const dx = Math.max(28, Math.round(Math.abs(dy) / slope));
        curX += dx;
        curY = nextY;
        waveNodes.push({ x: curX, y: curY });
        idx++;
      }
    } else if (mode === 'ship') {
      // Cổng Straight Fly 3 gai trên & 3 gai dưới giống hệt yt_max.jpg
      player.y = 105;
      const gateW = 66; // vừa khít 3 gai rộng 22px
      const spacing = difficultyTier === 'extreme' ? 148 : 172;
      const count = Math.ceil((p.speed * (activeSec + 0.8)) / spacing);
      const centers = [105, 92, 118, 84, 105, 124, 90, 108];
      for (let i = 0; i < count; i++) {
        const x = leadX + i * spacing;
        const cy = centers[i % centers.length];
        corridorGates.push({
          x,
          w: gateW,
          topBlockH: Math.max(CEIL_Y + 4, cy - p.gap / 2 - 22),
          botBlockY: Math.min(FLOOR_Y - 4, cy + p.gap / 2 + 22),
          spikeH: 22,
          centerY: cy
        });
      }
    } else if (mode === 'ufo') {
      // Chuỗi cột lưới 1 ô nhô từ dưới & treo từ trên xen kẽ có mũi gai nhọn giống hệt yt_3.jpg
      player.y = 105;
      const colW = 26;
      const spacing = difficultyTier === 'extreme' ? 112 : 138;
      const count = Math.ceil((p.speed * (activeSec + 0.8)) / spacing);
      for (let i = 0; i < count; i++) {
        const x = leadX + i * spacing;
        const fromBottom = i % 2 === 0;
        if (fromBottom) {
          const tipY = difficultyTier === 'extreme' ? 76 + ((i * 17) % 24) : 92 + ((i * 13) % 20);
          corridorGates.push({ x, w: colW, type: 'up_pillar', tipY, spikeH: 22 });
        } else {
          const tipY = difficultyTier === 'extreme' ? 134 - ((i * 19) % 24) : 118 - ((i * 15) % 20);
          corridorGates.push({ x, w: colW, type: 'down_pillar', tipY, spikeH: 22 });
        }
      }
    } else if (mode === 'rhythm') {
      let curX = Math.round(115 + p.speed * WARMUP_SECONDS);
      const maxX = Math.round(115 + p.speed * (duration - 0.35));
      let idx = 0;
      while (curX < maxX) {
        rhythmBeats.push({
          x: curX,
          y: 105 + ((idx % 3) - 1) * 22,
          hit: false,
          missed: false,
          delta: 0
        });
        curX += p.spacings[idx % p.spacings.length];
        idx++;
      }
    }
  }

  function spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      player.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 6,
        vx: -60 - Math.random() * 60,
        vy: (Math.random() - 0.5) * 55,
        life: 0.25 + Math.random() * 0.2
      });
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
      if (onGround) {
        onGround = false;
        player.vy = p.jumpVy;
        spawnParticles(player.x - 6, player.y + 10, 5);
      }
    } else if (activeMode === 'ufo') {
      player.vy = p.jumpVy;
      spawnParticles(player.x - 6, player.y + 6, 4);
    } else if (activeMode === 'spam_click') {
      spamClicks.push(performance.now());
      player.vy = p.jumpVy;
      spawnParticles(player.x - 6, player.y + 4, 3);
    } else if (activeMode === 'rhythm') {
      const targetX = 115;
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
      if (nearest && minDist <= p.hitWindow) {
        nearest.hit = true;
        nearest.delta = minDist;
        // Bấm lệch nhẹ trừ một phần nhỏ Accuracy ("100% Accuracy but not perfect" nếu lệch > 10px)
        if (minDist > 10) {
          accuracyFloat = Math.max(0, accuracyFloat - ((minDist - 10) / p.hitWindow) * 3.2);
        }
        spawnParticles(targetX, nearest.y, 6);
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
      const rk = getSkillRank(bestSessionScore);
      metaEl.textContent = `Lượt: ${attemptsUsed}/${maxAttempts} • Kỷ lục: ${bestSessionScore}% (${rk.label})`;
    }
    const badgeEl = document.getElementById('minigame-tier-badge');
    if (badgeEl) {
      badgeEl.textContent = `THE SKILL TESTER • ${TIER_PARAMS[difficultyTier].badge}`;
      badgeEl.classList.toggle('extreme', difficultyTier === 'extreme');
    }
  }

  function getWaveCenterAt(x) {
    if (waveNodes.length < 2) return 105;
    for (let i = 0; i < waveNodes.length - 1; i++) {
      const a = waveNodes[i];
      const b = waveNodes[i + 1];
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / Math.max(1, b.x - a.x);
        return a.y + (b.y - a.y) * t;
      }
    }
    return waveNodes[waveNodes.length - 1].y;
  }

  function updatePhysics(dt) {
    if (gameState !== 'playing') return;
    const tier = TIER_PARAMS[difficultyTier];
    const p = tier[activeMode];
    const duration = getModeDuration(activeMode);

    elapsedTime += dt;
    progress = Math.min(100, (elapsedTime / duration) * 100);
    const dx = (p.speed || 240) * dt;
    bgScrollX = (bgScrollX + dx * 0.45) % 56;
    isColliding = false;

    // Cập nhật hạt bụi trắng
    for (let i = player.particles.length - 1; i >= 0; i--) {
      const pt = player.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) player.particles.splice(i, 1);
    }

    if (activeMode === 'timing') {
      const prevY = player.y;
      player.vy += p.gravity * dt;
      player.y += player.vy * dt;
      onGround = false;

      timingBlocks.forEach((b) => (b.x -= dx));
      timingSpikes.forEach((s) => (s.x -= dx));

      // Đứng trên bục 1.0 walkable, còn đâm vào trụ treo hoặc cạnh trước bục thì tính chạm hitbox
      for (const b of timingBlocks) {
        if (player.x + 9 > b.x && player.x - 9 < b.x + b.w) {
          if (b.walkable && prevY + 11 <= b.y + 10 && player.vy >= 0 && player.y + 11 >= b.y) {
            player.y = b.y - 11;
            player.vy = 0;
            onGround = true;
          } else if (player.y + 9 > b.y + 2 && player.y - 9 < b.y + b.h - 2) {
            isColliding = true;
          }
        }
      }

      if (player.y >= FLOOR_Y - 11) {
        if (!onGround && player.vy > 120) spawnParticles(player.x - 4, FLOOR_Y - 2, 4);
        player.y = FLOOR_Y - 11;
        player.vy = 0;
        onGround = true;
      }

      if (onGround) {
        player.angle = Math.round(player.angle / (Math.PI / 2)) * (Math.PI / 2);
        if (isHolding) {
          onGround = false;
          player.vy = p.jumpVy;
          spawnParticles(player.x - 6, FLOOR_Y - 2, 4);
        }
      } else {
        player.angle += p.rotSpeed * dt;
      }

      // Kiểm tra chạm gai (sàn & gai ngược trên trụ)
      for (const s of timingSpikes) {
        if (player.x + 7 > s.x + 4 && player.x - 7 < s.x + s.w - 4) {
          if (s.dir === 'up') {
            if (player.y + 9 > s.y - s.h + 6 && player.y - 9 < s.y) isColliding = true;
          } else {
            if (player.y - 9 < s.y + s.h - 6 && player.y + 9 > s.y) isColliding = true;
          }
        }
      }

      player.trail.push({ x: player.x, y: player.y + 8 });
      if (player.trail.length > 65) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= dx));
    } else if (activeMode === 'spam_click') {
      const now = performance.now();
      spamClicks = spamClicks.filter((t) => now - t < 1000);
      player.vy += p.gravity * dt;
      player.vy = Math.max(-240, Math.min(240, player.vy));
      player.y += player.vy * dt;

      if (player.y < CEIL_Y + 12) {
        player.y = CEIL_Y + 12;
        player.vy = 0;
      }
      if (player.y > FLOOR_Y - 12) {
        player.y = FLOOR_Y - 12;
        player.vy = 0;
      }

      // Ra ngoài hành lang an toàn giữa 2 hàng gai (sau giai đoạn chạy đà 1.2s) sẽ trừ Accuracy
      if (elapsedTime > 1.2 && Math.abs(player.y - 105) > p.safeHalfGap) {
        isColliding = true;
      }

      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 65) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= dx));
    } else if (activeMode === 'wave') {
      player.vy = isHolding ? -p.vy : p.vy;
      player.y += player.vy * dt;
      player.y = Math.max(CEIL_Y + 6, Math.min(FLOOR_Y - 6, player.y));
      player.angle = isHolding ? -Math.PI / 4 : Math.PI / 4;

      waveNodes.forEach((n) => (n.x -= dx));
      const centerY = getWaveCenterAt(player.x);
      if (elapsedTime > WARMUP_SECONDS * 0.85 && Math.abs(player.y - centerY) > p.halfGap) {
        isColliding = true;
      }

      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 75) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= dx));
    } else if (activeMode === 'ship') {
      player.vy += (isHolding ? p.upAccel : p.downGravity) * dt;
      player.vy = Math.max(-p.maxVy, Math.min(p.maxVy, player.vy));
      player.y += player.vy * dt;
      if (player.y < CEIL_Y + 9) {
        player.y = CEIL_Y + 9;
        player.vy = 0;
        isColliding = true;
      }
      if (player.y > FLOOR_Y - 9) {
        player.y = FLOOR_Y - 9;
        player.vy = 0;
        isColliding = true;
      }
      player.angle = Math.atan2(player.vy, p.speed) * 0.75;

      corridorGates.forEach((g) => {
        g.x -= dx;
        if (player.x + 9 > g.x + 3 && player.x - 9 < g.x + g.w - 3) {
          const safeTop = g.topBlockH + g.spikeH - 4;
          const safeBot = g.botBlockY - g.spikeH + 4;
          if (player.y - 8 < safeTop || player.y + 8 > safeBot) {
            isColliding = true;
          }
        }
      });

      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 65) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= dx));
    } else if (activeMode === 'ufo') {
      player.vy += p.gravity * dt;
      player.vy = Math.min(340, player.vy);
      player.y += player.vy * dt;
      if (player.y < CEIL_Y + 10) {
        player.y = CEIL_Y + 10;
        player.vy = 0;
        isColliding = true;
      }
      if (player.y > FLOOR_Y - 10) {
        player.y = FLOOR_Y - 10;
        player.vy = 0;
      }

      corridorGates.forEach((g) => {
        g.x -= dx;
        if (player.x + 9 > g.x + 3 && player.x - 9 < g.x + g.w - 3) {
          if (g.type === 'up_pillar') {
            if (player.y + 9 > g.tipY + 4) isColliding = true;
          } else {
            if (player.y - 9 < g.tipY - 4) isColliding = true;
          }
        }
      });

      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 65) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= dx));
    } else if (activeMode === 'rhythm') {
      rhythmBeats.forEach((b) => {
        b.x -= dx;
        if (b.x < 68 && !b.hit && !b.missed) {
          b.missed = true;
          accuracyFloat = Math.max(0, accuracyFloat - p.missPenalty);
        }
      });
    }

    if (isColliding) {
      accuracyFloat = Math.max(0, accuracyFloat - tier.penaltyPerSec * dt);
    }

    currentScore = Math.max(0, Math.min(100, Math.round(accuracyFloat)));
    if (elapsedTime >= duration) {
      finishAttempt(currentScore);
    }
  }

  // Vẽ khối lưới 1.0 xanh đen viền trắng giống The Skill Tester
  function drawGridBlock(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#030d26';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(28, 86, 196, 0.65)';
    ctx.lineWidth = 1;
    const step = 12;
    for (let gx = x + step; gx < x + w; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y + step; gy < y + h; gy += step) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  // Vẽ gai đen viền trắng phát sáng nhẹ chuẩn Geometry Dash 1.0
  function drawClassicSpike(x, baseY, w, h, dir) {
    ctx.save();
    ctx.fillStyle = '#030712';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (dir === 'up') {
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + w / 2, baseY - h);
      ctx.lineTo(x + w, baseY);
    } else {
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + w / 2, baseY + h);
      ctx.lineTo(x + w, baseY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Icon Cube thỏ trắng ">w<" giống trong video The Skill Tester (0:02 & yt_max.jpg)
  function drawSkillTesterCube(cx, cy, size, angle) {
    const half = size / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.fillStyle = isColliding ? '#fda4af' : '#f8f7ff';
    ctx.strokeStyle = '#090514';
    ctx.lineWidth = 1.8;

    // Khối có khuyết tai thỏ phía trên giống icon trong video
    ctx.beginPath();
    ctx.moveTo(-half, -half);
    ctx.lineTo(-half + size * 0.3, -half);
    ctx.lineTo(-half + size * 0.3, -half + size * 0.26);
    ctx.lineTo(half - size * 0.3, -half + size * 0.26);
    ctx.lineTo(half - size * 0.3, -half);
    ctx.lineTo(half, -half);
    ctx.lineTo(half, half);
    ctx.lineTo(-half, half);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lõi tai tím nhạt
    ctx.fillStyle = '#a5b4fc';
    ctx.fillRect(-half + 2.5, -half + 2.5, size * 0.16, size * 0.22);
    ctx.fillRect(half - 2.5 - size * 0.16, -half + 2.5, size * 0.16, size * 0.22);

    // Biểu cảm >w<
    ctx.fillStyle = '#090514';
    ctx.font = `bold ${Math.max(7, Math.round(size * 0.36))}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('>w<', 0, half - size * 0.2);

    ctx.restore();
  }

  function drawSkillTesterShip(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    drawSkillTesterCube(-1, -5, 12, 0);

    // Thân tàu cánh trắng viền đen giống yt_max.jpg
    ctx.fillStyle = isColliding ? '#fda4af' : '#f8f7ff';
    ctx.strokeStyle = '#090514';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-8, -2);
    ctx.lineTo(5, -2);
    ctx.lineTo(10, -7);
    ctx.lineTo(17, 2);
    ctx.lineTo(8, 8);
    ctx.lineTo(-12, 7);
    ctx.lineTo(-9, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#090514';
    ctx.beginPath();
    ctx.arc(10, 2, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawSkillTesterWave(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = isColliding ? '#fda4af' : '#f8f7ff';
    ctx.strokeStyle = '#090514';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-9, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSkillTesterUFO(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    // Vòm kính xanh nhạt + Cube nhỏ
    ctx.fillStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -2, 9, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    drawSkillTesterCube(0, -4, 10, 0);

    // Đĩa bay trắng viền đen
    ctx.fillStyle = isColliding ? '#fda4af' : '#f8f7ff';
    ctx.strokeStyle = '#090514';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 3, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Huy chương tròn 16 ngôi sao chuẩn The Skill Tester (yt_max.jpg & yt_1.jpg)
  function drawRankStamp(cx, cy, radius, score) {
    const rk = getSkillRank(score);
    ctx.save();
    ctx.translate(cx, cy);

    // Viền trắng ngoài cùng
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Vòng đen + Vòng màu neon
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = rk.ringBg;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = rk.color;
    ctx.stroke();

    // Vòng trong
    const innerR = radius * 0.66;
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = rk.color;
    ctx.stroke();

    // 14 ngôi sao nhỏ chạy quanh vành huy chương
    const starOrbit = (radius + innerR) / 2;
    const starCount = 14;
    ctx.fillStyle = rk.color;
    for (let i = 0; i < starCount; i++) {
      const a = (i / starCount) * Math.PI * 2 - Math.PI / 2;
      const sx = Math.cos(a) * starOrbit;
      const sy = Math.sin(a) * starOrbit;
      ctx.beginPath();
      for (let p = 0; p < 10; p++) {
        const sr = p % 2 === 0 ? radius * 0.085 : radius * 0.038;
        const sa = a + (p * Math.PI) / 5;
        if (p === 0) ctx.moveTo(sx + Math.cos(sa) * sr, sy + Math.sin(sa) * sr);
        else ctx.lineTo(sx + Math.cos(sa) * sr, sy + Math.sin(sa) * sr);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Chữ PERFECT / S+ / S / A...
    ctx.fillStyle = rk.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const fontSize = rk.label.length > 3 ? Math.round(radius * 0.25) : Math.round(radius * 0.5);
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(rk.label, 0, 1);
    ctx.fillText(rk.label, 0, 1);

    ctx.restore();
  }

  function renderArena() {
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // 1. Nền xanh dương Royal Blue chuẩn Geometry Dash / The Skill Tester
    ctx.fillStyle = '#1155cc';
    ctx.fillRect(0, 0, W, H);

    // Các ô vuông nền xanh đậm trôi parallax nhẹ giống 0:02 & yt_max.jpg
    ctx.fillStyle = '#0d47b0';
    ctx.strokeStyle = '#0a3b96';
    ctx.lineWidth = 1.5;
    for (let bx = -bgScrollX; bx < W + 60; bx += 56) {
      ctx.fillRect(bx + 6, 36, 42, 42);
      ctx.strokeRect(bx + 6, 36, 42, 42);
      ctx.fillRect(bx + 20, 92, 34, 34);
      ctx.strokeRect(bx + 20, 92, 34, 34);
      ctx.fillRect(bx + 4, 134, 44, 40);
      ctx.strokeRect(bx + 4, 134, 44, 40);
    }

    // 2. Vẽ từng chế độ chơi theo đúng bố cục video The Skill Tester
    if (activeMode === 'wave' && waveNodes.length > 1) {
      const p = TIER_PARAMS[difficultyTier].wave;
      // Phần ngoài đường hầm Wave phủ lưới xanh đen 1.0 + viền trắng dốc 45° giống yt_2.jpg
      ctx.save();
      ctx.fillStyle = '#041238';

      // Mảng tường trên đường hầm Wave
      ctx.beginPath();
      ctx.moveTo(waveNodes[0].x, CEIL_Y);
      waveNodes.forEach((n) => ctx.lineTo(n.x, n.y - p.halfGap));
      ctx.lineTo(waveNodes[waveNodes.length - 1].x, CEIL_Y);
      ctx.closePath();
      ctx.fill();

      // Mảng tường dưới đường hầm Wave
      ctx.beginPath();
      ctx.moveTo(waveNodes[0].x, FLOOR_Y);
      waveNodes.forEach((n) => ctx.lineTo(n.x, n.y + p.halfGap));
      ctx.lineTo(waveNodes[waveNodes.length - 1].x, FLOOR_Y);
      ctx.closePath();
      ctx.fill();

      // Kẻ lưới mảnh trên phần tường Wave
      ctx.strokeStyle = 'rgba(32, 96, 210, 0.35)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 14) {
        ctx.beginPath();
        ctx.moveTo(gx, CEIL_Y);
        ctx.lineTo(gx, FLOOR_Y);
        ctx.stroke();
      }

      // Hai đường biên trắng dốc 45°
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      waveNodes.forEach((n, i) => {
        if (i === 0) ctx.moveTo(n.x, n.y - p.halfGap);
        else ctx.lineTo(n.x, n.y - p.halfGap);
      });
      ctx.stroke();

      ctx.beginPath();
      waveNodes.forEach((n, i) => {
        if (i === 0) ctx.moveTo(n.x, n.y + p.halfGap);
        else ctx.lineTo(n.x, n.y + p.halfGap);
      });
      ctx.stroke();

      // Đường dẫn trắng chính giữa đường hầm Wave giống hệt yt_2.jpg!
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      waveNodes.forEach((n, i) => {
        if (i === 0) ctx.moveTo(n.x, n.y);
        else ctx.lineTo(n.x, n.y);
      });
      ctx.stroke();
      ctx.restore();
    } else if (activeMode === 'timing') {
      timingBlocks.forEach((b) => {
        if (b.x + b.w < -20 || b.x > W + 20) return;
        drawGridBlock(b.x, b.y, b.w, b.h);
      });
      timingSpikes.forEach((s) => {
        if (s.x + s.w < -20 || s.x > W + 20) return;
        drawClassicSpike(s.x, s.y, s.w, s.h, s.dir);
      });
    } else if (activeMode === 'ship') {
      corridorGates.forEach((g) => {
        if (g.x + g.w < -30 || g.x > W + 30) return;
        // Khối trên + 3 gai ngược (giống hệt yt_max.jpg)
        drawGridBlock(g.x, CEIL_Y, g.w, g.topBlockH - CEIL_Y);
        for (let k = 0; k < 3; k++) {
          drawClassicSpike(g.x + k * 22, g.topBlockH, 22, g.spikeH, 'down');
        }
        // Khối dưới + 3 gai xuôi
        drawGridBlock(g.x, g.botBlockY, g.w, FLOOR_Y - g.botBlockY);
        for (let k = 0; k < 3; k++) {
          drawClassicSpike(g.x + k * 22, g.botBlockY, 22, g.spikeH, 'up');
        }
      });
    } else if (activeMode === 'ufo') {
      // Chuỗi cột gai trên/dưới xen kẽ giống hệt yt_3.jpg
      corridorGates.forEach((g) => {
        if (g.x + g.w < -30 || g.x > W + 30) return;
        if (g.type === 'up_pillar') {
          const blockY = g.tipY + g.spikeH;
          drawGridBlock(g.x, blockY, g.w, FLOOR_Y - blockY);
          drawClassicSpike(g.x, blockY, g.w, g.spikeH, 'up');
        } else {
          const blockH = g.tipY - g.spikeH - CEIL_Y;
          drawGridBlock(g.x, CEIL_Y, g.w, blockH);
          drawClassicSpike(g.x, CEIL_Y + blockH, g.w, g.spikeH, 'down');
        }
      });
    } else if (activeMode === 'spam_click') {
      const p = TIER_PARAMS[difficultyTier].spam_click;
      const topSpikeBase = 105 - p.safeHalfGap - 18;
      const botSpikeBase = 105 + p.safeHalfGap + 18;
      drawGridBlock(0, CEIL_Y, W, Math.max(2, topSpikeBase - CEIL_Y));
      drawGridBlock(0, botSpikeBase, W, Math.max(2, FLOOR_Y - botSpikeBase));
      for (let sx = -((bgScrollX * 1.6) % 22); sx < W + 22; sx += 22) {
        drawClassicSpike(sx, topSpikeBase, 22, 18, 'down');
        drawClassicSpike(sx, botSpikeBase, 22, 18, 'up');
      }
      // Đường tâm xanh mờ + chỉ báo CPS
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 105);
      ctx.lineTo(W, 105);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`CPS: ${spamClicks.length}`, 18, 44);
    } else if (activeMode === 'rhythm') {
      // Vạch căn nhịp trắng phát sáng
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(115, CEIL_Y + 6);
      ctx.lineTo(115, FLOOR_Y - 6);
      ctx.stroke();
      ctx.restore();

      rhythmBeats.forEach((b) => {
        if (b.x < -30 || b.x > W + 30) return;
        ctx.save();
        const col = b.hit ? '#00ff22' : b.missed ? '#ef4444' : '#ffe600';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.globalAlpha = b.missed ? 0.35 : 0.88;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 3. Viền trần & sàn lưới 1.0 xanh đen viền trắng + ánh tím rìa giống hệt 0:02 & yt_3.jpg
    drawGridBlock(-2, -2, W + 4, CEIL_Y + 2);
    drawGridBlock(-2, FLOOR_Y, W + 4, H - FLOOR_Y + 2);

    const topGlow = ctx.createLinearGradient(0, 0, 0, CEIL_Y + 8);
    topGlow.addColorStop(0, 'rgba(130, 55, 255, 0.42)');
    topGlow.addColorStop(1, 'rgba(130, 55, 255, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, CEIL_Y + 8);

    const botGlow = ctx.createLinearGradient(0, H - (H - FLOOR_Y + 8), 0, H);
    botGlow.addColorStop(0, 'rgba(130, 55, 255, 0)');
    botGlow.addColorStop(1, 'rgba(130, 55, 255, 0.42)');
    ctx.fillStyle = botGlow;
    ctx.fillRect(0, FLOOR_Y - 8, W, H - FLOOR_Y + 8);

    // 4. Đường quỹ đạo xanh lá liền mạch (#00ff22) + hạt vuông trắng giống hệt video!
    if (activeMode !== 'rhythm' && player.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#00ff22';
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      player.trail.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    player.particles.forEach((pt) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pt.x - 2, pt.y - 2, 3.5, 3.5);
    });

    // 5. Vẽ nhân vật theo từng mode
    if (activeMode === 'timing') {
      drawSkillTesterCube(player.x, player.y, 22, player.angle);
    } else if (activeMode === 'ship') {
      drawSkillTesterShip(player.x, player.y, player.angle);
    } else if (activeMode === 'wave') {
      drawSkillTesterWave(player.x, player.y, player.angle);
    } else if (activeMode === 'ufo' || activeMode === 'spam_click') {
      drawSkillTesterUFO(player.x, player.y);
    }

    // 6. Thanh tiến độ mảnh ở rìa trên + Bộ đếm "TOTAL ACCURACY (%): 100" chuẩn video
    const duration = getModeDuration(activeMode);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(16, 8, W - 235, 5);
    ctx.fillStyle = '#00ff22';
    ctx.fillRect(16, 8, ((W - 235) * Math.min(100, progress)) / 100, 5);

    ctx.save();
    ctx.font = '900 12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const accText = `TOTAL ACCURACY (%): ${currentScore}`;
    ctx.strokeText(accText, W - 82, 15);
    ctx.fillStyle = isColliding ? '#ff4d6d' : '#ffffff';
    ctx.fillText(accText, W - 82, 15);

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.strokeText(`${Math.min(duration, elapsedTime).toFixed(1)}s/${duration}s`, W - 14, 15);
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(`${Math.min(duration, elapsedTime).toFixed(1)}s/${duration}s`, W - 14, 15);
    ctx.restore();

    // 7. Màn hình chờ / Tổng kết với Huy chương tròn 16 ngôi sao chuẩn The Skill Tester
    if (gameState !== 'playing') {
      ctx.fillStyle = 'rgba(4, 10, 30, 0.78)';
      ctx.fillRect(0, 0, W, H);

      if (gameState === 'idle') {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.font = '900 18px Inter, sans-serif';
        ctx.strokeText('THE SKILL TESTER — NHẤN SPACE / CHUỘT ĐỂ BẮT ĐẦU', W / 2, H / 2 - 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('THE SKILL TESTER — NHẤN SPACE / CHUỘT ĐỂ BẮT ĐẦU', W / 2, H / 2 - 4);

        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('Giữ 100% không va chạm để đạt huy chương PERFECT!', W / 2, H / 2 + 20);
        ctx.restore();
      } else {
        // Bố cục giống yt_max.jpg: Chữ TOTAL ACCURACY (%) lớn + Huy chương sao tròn bên phải
        const stampX = W / 2 + 135;
        const stampY = H / 2 + 10;
        drawRankStamp(stampX, stampY, 58, currentScore);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;

        ctx.font = '900 15px Inter, sans-serif';
        ctx.strokeText('TOTAL ACCURACY (%):', W / 2 - 75, H / 2 - 34);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TOTAL ACCURACY (%):', W / 2 - 75, H / 2 - 34);

        ctx.font = '900 42px Inter, sans-serif';
        ctx.strokeText(`${currentScore}`, W / 2 - 75, H / 2 + 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${currentScore}`, W / 2 - 75, H / 2 + 10);

        const bestRk = getSkillRank(bestSessionScore);
        ctx.font = '700 13px Inter, sans-serif';
        ctx.fillStyle = '#bae6fd';
        ctx.fillText(
          `Kỷ lục phiên: ${bestSessionScore}% (${bestRk.label}) — Nhấn để thử lại!`,
          W / 2 - 75,
          H / 2 + 44
        );
        ctx.restore();
      }
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
      };

      wrap.addEventListener('mousedown', downHandler);
      window.addEventListener('mouseup', upHandler);
      wrap.addEventListener('touchstart', downHandler, { passive: false });
      window.addEventListener('touchend', upHandler);

      window.addEventListener('keydown', (e) => {
        if (
          e.code === 'Space' &&
          activeMode &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA'
        ) {
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
