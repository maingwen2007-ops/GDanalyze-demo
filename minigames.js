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
  let rhythmBeats = [];
  let spamClicks = [];
  let lastFrameTime = 0;
  let difficultyTier = 'extreme'; // 'extreme' (Top Extreme Demon - Prismline) | 'standard'

  const TIER_PARAMS = {
    extreme: {
      badge: 'PRISMLINE • TẬP LUYỆN',
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
      title: 'Bài test 1: Timing (Canh thời điểm nhảy qua gai)',
      maxAttempts: 3,
      hint: 'Nhấn Chuột / Space đúng lúc tiếp cận cụm gai đỏ để nhảy qua.'
    },
    spam_click: {
      title: 'Bài test 2: Spam click (Tốc độ nhấp CPS cao & giữ tâm)',
      maxAttempts: 1,
      hint: 'Nhấp Chuột / Space liên tục thật nhanh trong 5 giây để giữ năng lượng ở mức tối đa!'
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
    rhythmBeats = [];
    spamClicks = [];
    player.trail = [];
    player.angle = 0;
    progress = 0;
    currentScore = 0;

    const p = TIER_PARAMS[difficultyTier][mode];

    if (mode === 'timing') {
      player.y = 160;
      player.vy = 0;
      p.positions.forEach((x, idx) => {
        obstacles.push({
          x,
          w: p.widths[idx % p.widths.length],
          h: p.heights[idx % p.heights.length]
        });
      });
    } else if (mode === 'wave') {
      player.y = 105;
      player.vy = 0;
      for (let i = 0; i < p.count; i++) {
        const x = p.startX + i * p.spacing;
        const center = difficultyTier === 'extreme'
          ? 62 + ((i * 43) % 82)
          : 68 + ((i * 33) % 72);
        const gap = Math.max(p.minGap, p.baseGap - i * 0.75);
        obstacles.push({ x, w: p.width, topH: center - gap / 2, botY: center + gap / 2 });
      }
    } else if (mode === 'ship') {
      player.y = 105;
      player.vy = 0;
      for (let i = 0; i < p.count; i++) {
        const x = p.startX + i * p.spacing;
        const center = difficultyTier === 'extreme'
          ? 96 + Math.sin(i * 0.85) * 32
          : 92 + Math.sin(i * 0.7) * 26;
        const gap = Math.max(p.minGap, p.baseGap - i * 0.55);
        obstacles.push({ x, w: p.width, topH: center - gap / 2, botY: center + gap / 2 });
      }
    } else if (mode === 'ufo') {
      player.y = 100;
      player.vy = 0;
      for (let i = 0; i < p.count; i++) {
        const x = p.startX + i * p.spacing;
        const center = difficultyTier === 'extreme'
          ? 64 + ((i * 45) % 78)
          : 68 + ((i * 41) % 68);
        obstacles.push({ x, w: p.width, topH: center - p.gap / 2, botY: center + p.gap / 2 });
      }
    } else if (mode === 'rhythm') {
      let curX = 260;
      for (let i = 0; i < p.count; i++) {
        rhythmBeats.push({
          x: curX,
          hit: false,
          missed: false,
          accuracy: 0
        });
        curX += p.spacings[i % p.spacings.length];
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
      if (player.y >= 158) {
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

    if (activeMode === 'timing') {
      const speed = p.speed * dt;
      progress = Math.min(100, progress + dt * p.progressRate);
      player.vy += p.gravity * dt;
      player.y += player.vy * dt;
      if (player.y >= 160) {
        player.y = 160;
        player.angle = Math.round(player.angle / (Math.PI / 2)) * (Math.PI / 2);
        player.vy = isHolding ? p.jumpVy : 0;
      } else {
        player.angle += p.rotSpeed * dt;
      }

      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 26) player.trail.shift();
      player.trail.forEach((pt) => (pt.x -= speed));

      for (const ob of obstacles) {
        ob.x -= speed;
        if (
          player.x + 12 > ob.x &&
          player.x - 10 < ob.x + ob.w &&
          player.y + 14 > 176 - ob.h
        ) {
          finishAttempt(progress);
          return;
        }
      }
      currentScore = Math.round(progress);
      if (progress >= 100) finishAttempt(100);
    } else if (activeMode === 'wave') {
      const speed = p.speed * dt;
      progress = Math.min(100, progress + dt * p.progressRate);
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
      if (progress >= 100) finishAttempt(100);
    } else if (activeMode === 'ship') {
      const speed = p.speed * dt;
      progress = Math.min(100, progress + dt * p.progressRate);
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
      if (progress >= 100) finishAttempt(100);
    } else if (activeMode === 'ufo') {
      const speed = p.speed * dt;
      progress = Math.min(100, progress + dt * p.progressRate);
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
      if (progress >= 100) finishAttempt(100);
    } else if (activeMode === 'spam_click') {
      progress = Math.min(100, progress + dt * 20); // 5 giây
      const now = performance.now();
      spamClicks = spamClicks.filter((t) => now - t < 1000);
      const cps = spamClicks.length;
      currentScore = Math.min(100, Math.round((cps / p.targetCps) * 100));
      player.y = Math.min(170, player.y + p.decay * dt);
      if (progress >= 100) {
        finishAttempt(Math.max(currentScore, bestSessionScore));
      }
    } else if (activeMode === 'rhythm') {
      const speed = p.speed * dt;
      let allDone = true;
      rhythmBeats.forEach((b) => {
        b.x -= speed;
        if (b.x < 50 && !b.hit) {
          b.missed = true;
        }
        if (!b.hit && !b.missed) {
          allDone = false;
        }
      });
      const totalAcc = rhythmBeats.reduce((acc, b) => acc + (b.hit ? b.accuracy : 0), 0);
      currentScore = Math.round(totalAcc / rhythmBeats.length);
      progress = Math.round(
        (rhythmBeats.filter((b) => b.hit || b.missed).length / rhythmBeats.length) * 100
      );
      if (allDone) {
        finishAttempt(currentScore);
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

    // Thanh tiến độ phía trên
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(20, 10, W - 40, 6);
    ctx.fillStyle = '#a66eff';
    ctx.fillRect(20, 10, ((W - 40) * Math.min(100, progress)) / 100, 6);

    if (activeMode === 'timing') {
      // Mặt đất
      ctx.fillStyle = '#261447';
      ctx.fillRect(0, 176, W, H - 176);
      ctx.strokeStyle = '#a66eff';
      ctx.beginPath();
      ctx.moveTo(0, 176);
      ctx.lineTo(W, 176);
      ctx.stroke();

      // Gai đỏ
      ctx.fillStyle = '#fb7185';
      obstacles.forEach((ob) => {
        ctx.beginPath();
        ctx.moveTo(ob.x, 176);
        ctx.lineTo(ob.x + ob.w / 2, 176 - ob.h);
        ctx.lineTo(ob.x + ob.w, 176);
        ctx.closePath();
        ctx.fill();
      });

      // Vệt sáng nét đứt hồng/tím giống Geometry Dash
      if (player.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#ff2ad4';
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

      // Cube đen viền hồng/tím có họa tiết giống video
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
