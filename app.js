// Logic chính của ứng dụng GD ANALYZE: Hồ sơ kỹ năng, Gợi ý vừa sức (+10-20%), Lộ trình Challenge, Radar Chart & Diễn đàn

(function () {
  const STORAGE_KEY = 'gd_analyze_state_v1';

  const defaultState = {
    theme: 'default',
    activeTab: 'profile', // 'profile' | 'recommend' | 'forum'
    skills: {
      timing: 32,
      spam_click: 47,
      wave: 48,
      ship: 100,
      ufo: 100,
      rhythm: 79,
      accuracy: 62,
      consistency: 58
    },
    history: [
      {
        id: 'log_1',
        levelId: 'lvl_clubstep',
        progress: 100,
        attempts: 412,
        eloNote: '+5 Ship, +4 UFO',
        date: 'Hôm qua'
      },
      {
        id: 'log_2',
        levelId: 'lvl_deadlocked',
        progress: 73,
        attempts: 680,
        eloNote: '+3 Wave, +2 Spam click (Kẹt ở Wave 73%)',
        date: 'Hôm nay'
      }
    ],
    targetLevelId: 'lvl_nine_circles',
    targetDays: 30,
    completedRoadmapIds: [],
    forumPosts: window.GD_INITIAL_FORUM_POSTS,
    communityVotes: {}
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultState));
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        skills: { ...defaultState.skills, ...(parsed.skills || {}) }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore storage quota errors
    }
  }

  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'gd-toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  // Tính điểm trình độ tổng hợp (Overall Rating 0 - 100)
  function getOverallRating() {
    const vals = Object.values(state.skills);
    const sum = vals.reduce((a, b) => a + Number(b || 0), 0);
    return Math.round(sum / vals.length);
  }

  function getStrongestAndWeakest() {
    const entries = window.GD_SKILLS.map((s) => ({
      ...s,
      val: Number(state.skills[s.key] || 0)
    })).sort((a, b) => b.val - a.val);

    return {
      strongest: entries[0],
      secondStrongest: entries[1],
      weakest: entries[entries.length - 1],
      secondWeakest: entries[entries.length - 2]
    };
  }

  function getSkillTierName(rating) {
    if (rating < 30) return { tier: 'Beginner / Harder (6★ - 7★)', badge: '🌱 Tân binh GD' };
    if (rating < 52) return { tier: 'Easy Demon Tier', badge: '😈 Thợ săn Easy Demon' };
    if (rating < 68) return { tier: 'Medium Demon Tier', badge: '🔥 Chiến binh Medium Demon' };
    if (rating < 82) return { tier: 'Hard Demon Tier', badge: '⚡ Cao thủ Hard Demon' };
    if (rating < 91) return { tier: 'Insane Demon Tier', badge: '💎 Bậc thầy Insane Demon' };
    return { tier: 'Extreme Demon Slayer', badge: '👑 Huyền thoại Extreme Demon' };
  }

  // Cập nhật nút Thử thách nhanh (Timing ✓ 32, Spam click ✓ 47, Wave ✓ 48, Ship ✓ 100, UFO ✓ 100, Nhịp ✓ 79)
  function renderQuickChallengeButtons() {
    const map = [
      { key: 'timing', id: 'qc-btn-timing', label: 'Timing' },
      { key: 'spam_click', id: 'qc-btn-spam_click', label: 'Spam click' },
      { key: 'wave', id: 'qc-btn-wave', label: 'Wave' },
      { key: 'ship', id: 'qc-btn-ship', label: 'Ship' },
      { key: 'ufo', id: 'qc-btn-ufo', label: 'UFO' },
      { key: 'rhythm', id: 'qc-btn-rhythm', label: 'Nhịp' }
    ];
    map.forEach((item) => {
      const btn = document.getElementById(item.id);
      if (btn) {
        const val = Math.round(state.skills[item.key] || 0);
        btn.textContent = `${item.label} ✓ ${val}`;
      }
    });
  }

  // Render 8 thanh trượt Tự đánh giá kỹ năng
  function renderSkillSliders() {
    const container = document.getElementById('skills-sliders-grid');
    if (!container) return;
    container.innerHTML = '';

    window.GD_SKILLS.forEach((sk) => {
      const val = Math.round(state.skills[sk.key] || 0);
      const item = document.createElement('div');
      item.className = 'skill-slider-item';
      item.innerHTML = `
        <div class="skill-slider-top">
          <span class="skill-name">${sk.icon} ${sk.label}</span>
          <span class="skill-score-badge" id="badge-${sk.key}">${val} / 100</span>
        </div>
        <div class="skill-hint">${sk.desc}</div>
        <input
          type="range"
          min="0"
          max="100"
          value="${val}"
          class="gd-range"
          data-skill="${sk.key}"
        />
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.gd-range').forEach((input) => {
      input.addEventListener('input', (e) => {
        const key = e.target.getAttribute('data-skill');
        const val = Number(e.target.value);
        state.skills[key] = val;
        const badge = document.getElementById(`badge-${key}`);
        if (badge) badge.textContent = `${val} / 100`;
        saveState();
        renderQuickChallengeButtons();
        renderCurrentProfileSection();
        renderRecommendationsAndRoadmap();
      });
    });
  }

  // Render Mục 3: Màn bạn đã qua & Cập nhật Elo
  function renderPlayHistory() {
    const select = document.getElementById('history-level-select');
    if (select && select.options.length === 0) {
      window.GD_LEVELS.filter((l) => !l.is_challenge).forEach((lvl) => {
        const opt = document.createElement('option');
        opt.value = lvl.id;
        opt.textContent = `${lvl.name} (${lvl.official_difficulty} • ID: ${lvl.gd_level_id})`;
        select.appendChild(opt);
      });
    }

    const listEl = document.getElementById('history-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    state.history.forEach((h) => {
      const lvl = window.GD_LEVELS.find((l) => l.id === h.levelId) || {
        name: h.customName || 'Màn tùy chỉnh',
        official_difficulty: 'Demon',
        diff_tier: 'medium',
        gd_level_id: 'N/A'
      };
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <div class="history-item-info">
          <span class="diff-pill diff-${lvl.diff_tier || 'medium'}">${lvl.official_difficulty}</span>
          <strong>${lvl.name}</strong>
          <span class="level-id-pill" data-copy-id="${lvl.gd_level_id}">ID: ${lvl.gd_level_id} 📋</span>
          <span style="color: var(--text-secondary); font-size: 0.88rem;">
            Tiến độ: <strong>${h.progress}%</strong> • ${h.attempts} attempts
          </span>
          <span class="elo-delta">${h.eloNote || ''}</span>
        </div>
        <button class="btn-secondary btn-delete-log" data-id="${h.id}" style="padding: 5px 10px; font-size: 0.78rem;">Xóa</button>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll('.btn-delete-log').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.history = state.history.filter((x) => x.id !== id);
        saveState();
        renderPlayHistory();
      });
    });

    bindCopyIdButtons(listEl);
  }

  // Vẽ biểu đồ Radar 8 trục kỹ năng trong Mục 4
  function drawRadarChart() {
    const canvas = document.getElementById('skill-radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.34;

    ctx.clearRect(0, 0, W, H);

    const skills = window.GD_SKILLS;
    const N = skills.length;

    // Vẽ lưới đa giác đồng tâm (25%, 50%, 75%, 100%)
    [0.25, 0.5, 0.75, 1].forEach((scale) => {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius * scale;
        const y = cy + Math.sin(angle) * radius * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(203, 188, 230, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Vẽ trục & nhãn
    for (let i = 0; i < N; i++) {
      const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(203, 188, 230, 0.2)';
      ctx.stroke();

      const lx = cx + Math.cos(angle) * (radius + 26);
      const ly = cy + Math.sin(angle) * (radius + 20);
      const val = Math.round(state.skills[skills[i].key] || 0);
      ctx.fillStyle = '#e6dcf7';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${skills[i].shortLabel} (${val})`, lx, ly + 4);
    }

    // Vẽ vùng đa giác kỹ năng của người chơi
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
      const val = Math.max(5, Math.min(100, Number(state.skills[skills[i].key] || 0))) / 100;
      const x = cx + Math.cos(angle) * radius * val;
      const y = cy + Math.sin(angle) * radius * val;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(166, 110, 255, 0.34)';
    ctx.fill();
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vẽ các đỉnh tròn
    for (let i = 0; i < N; i++) {
      const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
      const val = Math.max(5, Math.min(100, Number(state.skills[skills[i].key] || 0))) / 100;
      const x = cx + Math.cos(angle) * radius * val;
      const y = cy + Math.sin(angle) * radius * val;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9900';
      ctx.fill();
    }
  }

  // Render Mục 4: Trình độ hiện tại
  function renderCurrentProfileSection() {
    drawRadarChart();
    const rating = getOverallRating();
    const tierInfo = getSkillTierName(rating);
    const { strongest, secondStrongest, weakest, secondWeakest } = getStrongestAndWeakest();

    const tierValEl = document.getElementById('profile-tier-value');
    const overallScoreEl = document.getElementById('profile-overall-score');
    const strongEl = document.getElementById('profile-strongest-skill');
    const weakEl = document.getElementById('profile-weakest-skill');
    const adviceEl = document.getElementById('profile-quick-advice');
    const badgesEl = document.getElementById('profile-badges-row');

    if (tierValEl) tierValEl.textContent = `${tierInfo.tier} (${rating}/100)`;
    if (overallScoreEl) overallScoreEl.textContent = `${rating} điểm Elo tổng hợp`;
    if (strongEl) strongEl.textContent = `${strongest.label} (${strongest.val}) & ${secondStrongest.label} (${secondStrongest.val})`;
    if (weakEl) weakEl.textContent = `${weakest.label} (${weakest.val}) & ${secondWeakest.label} (${secondWeakest.val})`;
    if (adviceEl) {
      adviceEl.textContent = `Bạn có lợi thế vượt trội ở ${strongest.label} (${strongest.val}/100), nhưng đang bị giới hạn bởi ${weakest.label} (${weakest.val}/100) và ${secondWeakest.label} (${secondWeakest.val}/100). Hệ thống đã lọc các màn vừa sức (+10% đến +20%) để kéo 2 kỹ năng này lên!`;
    }

    if (badgesEl) {
      const badges = [tierInfo.badge];
      if (state.skills.ship >= 90) badges.push('🚀 Thần đồng Straight Fly');
      if (state.skills.ufo >= 90) badges.push('🛸 Bậc thầy UFO');
      if (state.skills.rhythm >= 75) badges.push('🎵 Cảm âm chuẩn xác');
      if (state.skills.wave >= 75) badges.push('〰️ Nine Circles Master');
      if (state.history.length >= 2) badges.push(`📚 Đã lưu ${state.history.length} màn`);
      badgesEl.innerHTML = badges.map((b) => `<span class="gd-badge">${b}</span>`).join('');
    }
  }

  // Thuật toán Gợi ý màn "Vừa sức" (+10% đến +20% hoặc bù đắp kỹ năng yếu) & Lộ trình tới màn mục tiêu
  function renderRecommendationsAndRoadmap() {
    const rating = getOverallRating();
    const { strongest, weakest, secondWeakest } = getStrongestAndWeakest();

    // 1. Gợi ý vừa sức (Sweet-spot: cao hơn hoặc tiệm cận trình độ hiện tại, ưu tiên màn chưa 100%)
    const completedIds = new Set(
      state.history.filter((h) => h.progress >= 100).map((h) => h.levelId)
    );

    const sweetMin = Math.max(20, Math.round(rating * 0.78));
    const sweetMax = Math.min(98, Math.round(rating * 1.22));

    const scoredLevels = window.GD_LEVELS.filter(
      (l) => !l.is_challenge && !completedIds.has(l.id)
    ).map((lvl) => {
      const diffGap = lvl.overall_difficulty - rating;
      const inSweetSpot = lvl.overall_difficulty >= sweetMin && lvl.overall_difficulty <= sweetMax;
      // Điểm phù hợp dựa trên việc màn đó rèn đúng kỹ năng yếu ở mức vừa phải và tận dụng kỹ năng mạnh
      const weakTrainScore =
        100 - Math.abs((lvl.skills[weakest.key] || 50) - Math.min(85, weakest.val + 22));
      const strongLeverage = (lvl.skills[strongest.key] || 50) * 0.35;
      const sweetBonus = inSweetSpot ? 40 : Math.max(0, 30 - Math.abs(diffGap));

      return {
        lvl,
        matchScore: Math.round(sweetBonus + weakTrainScore * 0.4 + strongLeverage * 0.25),
        diffPercentDelta: Math.round(((lvl.overall_difficulty - rating) / Math.max(1, rating)) * 100)
      };
    });

    scoredLevels.sort((a, b) => b.matchScore - a.matchScore);
    const topRecs = scoredLevels.slice(0, 4);

    const recListEl = document.getElementById('sweetspot-rec-list');
    if (recListEl) {
      recListEl.innerHTML = '';
      topRecs.forEach(({ lvl, diffPercentDelta }) => {
        const deltaText =
          diffPercentDelta >= 0
            ? `+${Math.max(10, Math.min(22, diffPercentDelta || 12))}% thử thách vừa sức`
            : `Vừa tầm luyện kỹ năng yếu (${lvl.overall_difficulty}/100)`;

        // Tìm bài guide liên quan trên diễn đàn
        const linkedGuides = state.forumPosts.filter((p) => p.level_id === lvl.id);
        const guideHtml =
          linkedGuides.length > 0
            ? `<div style="margin-top: 10px; font-size: 0.84rem; color: #6ee7b7;">
                📘 <strong>Guide cộng đồng nổi bật:</strong> "${linkedGuides[0].title}" (▲ ${linkedGuides[0].upvotes})
               </div>`
            : '';

        const votedDiff = state.communityVotes[lvl.id] || lvl.community_difficulty;

        const card = document.createElement('div');
        card.className = 'level-rec-card';
        card.innerHTML = `
          <div class="level-rec-top">
            <div>
              <div class="level-title-row">
                <span class="diff-pill diff-${lvl.diff_tier}">${lvl.official_difficulty}</span>
                <span class="level-name">${lvl.name}</span>
                <span class="level-id-pill" data-copy-id="${lvl.gd_level_id}" title="Click để copy Level ID">
                  ID: ${lvl.gd_level_id} 📋
                </span>
              </div>
              <div style="font-size: 0.83rem; color: var(--text-muted); margin-top: 4px;">
                Tác giả: <strong>${lvl.creator}</strong> • Độ khó cộng đồng bình chọn: <strong style="color: #fcd34d;">${votedDiff}</strong>
              </div>
            </div>
            <span class="gd-badge">${deltaText}</span>
          </div>

          <div class="why-recommend-box">
            💡 <strong>Vì sao gợi ý màn này?</strong> Bạn rất mạnh <strong>${strongest.label} (${strongest.val})</strong> nhưng đang cần cải thiện <strong>${weakest.label} (${weakest.val})</strong> và <strong>${secondWeakest.label} (${secondWeakest.val})</strong>. Màn <em>${lvl.name}</em> yêu cầu ${weakest.label} ở mức <strong>${lvl.skills[weakest.key]}/100</strong> và ${secondWeakest.label} ở mức <strong>${lvl.skills[secondWeakest.key]}/100</strong> — vừa đủ để bạn nâng trình mà không bị ngợp!
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
            ${window.GD_SKILLS.slice(0, 6)
              .map(
                (s) =>
                  `<span class="tag-badge">${s.shortLabel}: ${lvl.skills[s.key]}%</span>`
              )
              .join('')}
          </div>

          <div class="heatmap-section">
            <div class="heatmap-header">
              <span>🔥 <strong>Phân tích chỗ hay chết (Death Heatmap):</strong> ${lvl.choke_point}</span>
              <span>0% → 100%</span>
            </div>
            <div class="heatmap-bar">
              ${lvl.heatmap
                .map((pct, idx) => {
                  const colors = ['#38bdf8', '#a66eff', '#fb7185', '#f59e0b', '#34d399'];
                  const isMax = pct === Math.max(...lvl.heatmap);
                  return `<div class="heatmap-segment" style="width: 20%; background: ${
                    isMax ? '#fb7185' : colors[idx % colors.length]
                  }; opacity: ${0.35 + (pct / 50) * 0.65};" title="Đoạn ${idx * 20}%-${
                    (idx + 1) * 20
                  }%: ${pct}% lượt chết"></div>`;
                })
                .join('')}
            </div>
            <div class="heatmap-tip">
              🎯 <strong>Mẹo vượt đoạn khó:</strong> ${lvl.choke_tip}
            </div>
            ${guideHtml}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
            <button class="btn-primary btn-quick-log" data-level-id="${lvl.id}" style="padding: 7px 14px; font-size: 0.84rem;">
              + Lưu vào màn đã chơi
            </button>
            <button class="btn-secondary btn-vote-diff" data-level-id="${lvl.id}" style="padding: 7px 14px; font-size: 0.84rem;">
              🗳️ Bình chọn lại độ khó
            </button>
          </div>
        `;
        recListEl.appendChild(card);
      });

      bindCopyIdButtons(recListEl);

      recListEl.querySelectorAll('.btn-quick-log').forEach((btn) => {
        btn.addEventListener('click', () => {
          const levelId = btn.getAttribute('data-level-id');
          const lvl = window.GD_LEVELS.find((l) => l.id === levelId);
          if (!lvl) return;
          addPlayHistoryEntry(lvl.id, 100, 250);
          showToast(`Đã ghi nhận hoàn thành "${lvl.name}" và cập nhật điểm Elo kỹ năng!`);
        });
      });

      recListEl.querySelectorAll('.btn-vote-diff').forEach((btn) => {
        btn.addEventListener('click', () => {
          const levelId = btn.getAttribute('data-level-id');
          const lvl = window.GD_LEVELS.find((l) => l.id === levelId);
          if (!lvl) return;
          const userVote = prompt(
            `Bình chọn lại độ khó & kỹ năng thực tế cho màn "${lvl.name}" (Hiện tại: ${lvl.community_difficulty}):`,
            lvl.community_difficulty
          );
          if (userVote && userVote.trim()) {
            state.communityVotes[lvl.id] = userVote.trim();
            saveState();
            renderRecommendationsAndRoadmap();
            showToast(`Cảm ơn! Đã cập nhật bình chọn cộng đồng cho màn ${lvl.name}.`);
          }
        });
      });
    }

    // 2. Lộ trình tới màn mục tiêu (Challenge Roadmap)
    renderTargetRoadmap();
  }

  function renderTargetRoadmap() {
    const targetSelect = document.getElementById('roadmap-target-select');
    if (targetSelect && targetSelect.options.length === 0) {
      window.GD_LEVELS.filter((l) => !l.is_challenge && l.overall_difficulty >= 45).forEach(
        (lvl) => {
          const opt = document.createElement('option');
          opt.value = lvl.id;
          opt.textContent = `${lvl.name} (${lvl.official_difficulty} • ID: ${lvl.gd_level_id})`;
          targetSelect.appendChild(opt);
        }
      );
      targetSelect.value = state.targetLevelId;
    }

    const targetLvl =
      window.GD_LEVELS.find((l) => l.id === state.targetLevelId) ||
      window.GD_LEVELS.find((l) => l.id === 'lvl_nine_circles');

    if (!targetLvl) return;

    // Tính khoảng cách vector kỹ năng: Delta = Target - User
    const gaps = window.GD_SKILLS.map((s) => {
      const req = targetLvl.skills[s.key] || 50;
      const cur = Number(state.skills[s.key] || 0);
      return {
        ...s,
        req,
        cur,
        deficit: req - cur
      };
    }).sort((a, b) => b.deficit - a.deficit);

    const gapChipsEl = document.getElementById('roadmap-gap-chips');
    if (gapChipsEl) {
      gapChipsEl.innerHTML = gaps
        .map((g) => {
          if (g.deficit > 0) {
            return `<span class="gap-chip">⚠️ Thiếu ${g.shortLabel}: cần ${g.req} (hiện tại ${g.cur}, thiếu +${g.deficit})</span>`;
          }
          return `<span class="gap-chip ok">✓ Đạt ${g.shortLabel}: cần ${g.req} (hiện tại ${g.cur})</span>`;
        })
        .join('');
    }

    // Chọn chuỗi màn Challenge + màn trung gian tăng dần để bù đúng các kỹ năng thiếu nhất
    const topDeficitSkills = gaps.filter((g) => g.deficit > 0).map((g) => g.key);
    const candidateSteps = window.GD_LEVELS.filter(
      (l) =>
        l.id !== targetLvl.id &&
        l.overall_difficulty <= targetLvl.overall_difficulty &&
        (l.is_challenge || l.overall_difficulty >= 35)
    );

    const scoredSteps = candidateSteps.map((lvl) => {
      let relevance = 0;
      topDeficitSkills.slice(0, 3).forEach((skKey, idx) => {
        relevance += (lvl.skills[skKey] || 0) * (3 - idx);
        if (lvl.focus_skill === skKey) relevance += 120;
      });
      return { lvl, relevance };
    });

    scoredSteps.sort((a, b) => b.relevance - a.relevance);
    const chosenSteps = scoredSteps
      .slice(0, 3)
      .map((x) => x.lvl)
      .sort((a, b) => a.overall_difficulty - b.overall_difficulty);

    // Bước cuối luôn là màn mục tiêu
    const fullChain = [...chosenSteps, targetLvl];

    const stepsContainer = document.getElementById('roadmap-steps-list');
    if (stepsContainer) {
      stepsContainer.innerHTML = '';
      fullChain.forEach((stepLvl, idx) => {
        const isFinal = stepLvl.id === targetLvl.id;
        const isDone = state.completedRoadmapIds.includes(stepLvl.id);
        const stepEl = document.createElement('div');
        stepEl.className = `roadmap-step ${isDone ? 'completed' : ''}`;
        stepEl.innerHTML = `
          <div class="step-number">${isDone ? '✓' : idx + 1}</div>
          <div class="step-body">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div class="level-title-row">
                <span class="diff-pill diff-${stepLvl.diff_tier}">${stepLvl.official_difficulty}</span>
                <strong>${isFinal ? '🎯 MỤC TIÊU ĐÍCH: ' : `Bước ${idx + 1}: `}${stepLvl.name}</strong>
                <span class="level-id-pill" data-copy-id="${stepLvl.gd_level_id}">
                  Copy ID: ${stepLvl.gd_level_id} 📋
                </span>
              </div>
              <button class="btn-secondary btn-toggle-step" data-step-id="${stepLvl.id}" style="padding: 5px 12px; font-size: 0.8rem;">
                ${isDone ? 'Đã hoàn thành ✓' : 'Đánh dấu hoàn thành'}
              </button>
            </div>
            <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 6px;">
              <strong>Trọng tâm rèn luyện:</strong> Timing ${stepLvl.skills.timing} • Wave ${stepLvl.skills.wave} • Spam ${stepLvl.skills.spam_click} • Ship ${stepLvl.skills.ship}
            </div>
            <div style="font-size: 0.83rem; color: #fcd34d; margin-top: 4px;">
              💡 Mẹo: ${stepLvl.choke_tip}
            </div>
          </div>
        `;
        stepsContainer.appendChild(stepEl);
      });

      bindCopyIdButtons(stepsContainer);
      stepsContainer.querySelectorAll('.btn-toggle-step').forEach((btn) => {
        btn.addEventListener('click', () => {
          const stepId = btn.getAttribute('data-step-id');
          if (state.completedRoadmapIds.includes(stepId)) {
            state.completedRoadmapIds = state.completedRoadmapIds.filter((x) => x !== stepId);
          } else {
            state.completedRoadmapIds.push(stepId);
            const lvl = window.GD_LEVELS.find((l) => l.id === stepId);
            if (lvl) addPlayHistoryEntry(lvl.id, 100, 180);
          }
          saveState();
          renderTargetRoadmap();
        });
      });
    }
  }

  // Thêm kết quả chơi & cập nhật điểm kỹ năng theo Elo
  function addPlayHistoryEntry(levelId, progress, attempts) {
    const lvl = window.GD_LEVELS.find((l) => l.id === levelId);
    if (!lvl) return;

    const factor = (progress / 100) * (attempts < 300 ? 1.15 : 0.9);
    const boosted = [];

    window.GD_SKILLS.forEach((sk) => {
      const req = lvl.skills[sk.key] || 50;
      const cur = Number(state.skills[sk.key] || 0);
      if (req * factor > cur) {
        const delta = Math.max(1, Math.min(6, Math.round((req * factor - cur) * 0.22)));
        state.skills[sk.key] = Math.min(100, cur + delta);
        boosted.push(`+${delta} ${sk.shortLabel}`);
      }
    });

    const eloNote =
      boosted.length > 0 ? `Elo: ${boosted.slice(0, 3).join(', ')}` : 'Giữ vững phong độ Elo';

    state.history.unshift({
      id: 'log_' + Date.now(),
      levelId,
      progress,
      attempts,
      eloNote,
      date: 'Vừa xong'
    });

    saveState();
    renderQuickChallengeButtons();
    renderSkillSliders();
    renderPlayHistory();
    renderCurrentProfileSection();
    renderRecommendationsAndRoadmap();
  }

  // Render Diễn đàn cộng đồng ("Facebook cho người chơi Geometry Dash")
  let currentForumFilter = 'ALL';

  function renderForum() {
    const listEl = document.getElementById('forum-posts-list');
    const searchInput = document.getElementById('forum-search-input');
    if (!listEl) return;

    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

    const filtered = state.forumPosts.filter((p) => {
      const matchTag =
        currentForumFilter === 'ALL' ||
        (p.tags && p.tags.some((t) => t.toLowerCase() === currentForumFilter.toLowerCase()));
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.level_name && p.level_name.toLowerCase().includes(query));
      return matchTag && matchQuery;
    });

    listEl.innerHTML = '';
    filtered.forEach((post) => {
      const card = document.createElement('div');
      card.className = 'forum-post-card';
      card.innerHTML = `
        <div class="post-meta">
          <span class="post-author">👤 ${post.author}</span>
          <span class="gd-badge" style="font-size: 0.72rem; padding: 2px 8px;">${post.authorBadge || 'Thành viên GD'}</span>
          <span>• ${post.createdAt}</span>
          ${post.level_name ? `<span class="tag-badge">🎮 ${post.level_name}</span>` : ''}
        </div>
        <div class="post-title">${post.title}</div>
        <div class="post-content">${post.content}</div>
        <div class="post-tags">
          ${(post.tags || []).map((t) => `<span class="tag-badge">${t}</span>`).join('')}
        </div>
        <div class="post-actions">
          <button class="btn-secondary btn-upvote-post" data-id="${post.id}">
            ▲ Hữu ích (${post.upvotes})
          </button>
          <button class="btn-secondary btn-toggle-comments" data-id="${post.id}">
            💬 Bình luận (${(post.comments || []).length})
          </button>
        </div>
        <div class="comments-box" id="comments-box-${post.id}">
          <div class="comments-list">
            ${(post.comments || [])
              .map(
                (c) =>
                  `<div class="comment-item"><strong>${c.author}:</strong> ${c.text} <span style="color: var(--text-muted); font-size: 0.75rem;">(${c.time})</span></div>`
              )
              .join('')}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <input type="text" class="gd-input comment-input" data-id="${post.id}" placeholder="Viết bình luận hoặc chia sẻ kinh nghiệm..." style="flex: 1; padding: 7px 10px; font-size: 0.85rem;" />
            <button class="btn-primary btn-send-comment" data-id="${post.id}" style="padding: 7px 14px; font-size: 0.84rem;">Gửi</button>
          </div>
        </div>
      `;
      listEl.appendChild(card);
    });

    listEl.querySelectorAll('.btn-upvote-post').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const post = state.forumPosts.find((p) => p.id === id);
        if (post) {
          post.upvotes++;
          saveState();
          renderForum();
        }
      });
    });

    listEl.querySelectorAll('.btn-toggle-comments').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const box = document.getElementById(`comments-box-${id}`);
        if (box) box.classList.toggle('open');
      });
    });

    listEl.querySelectorAll('.btn-send-comment').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const input = listEl.querySelector(`.comment-input[data-id="${id}"]`);
        if (!input || !input.value.trim()) return;
        const post = state.forumPosts.find((p) => p.id === id);
        if (post) {
          post.comments = post.comments || [];
          post.comments.push({
            author: 'Bạn (Dasher)',
            text: input.value.trim(),
            time: 'Vừa xong'
          });
          saveState();
          renderForum();
          const box = document.getElementById(`comments-box-${id}`);
          if (box) box.classList.add('open');
        }
      });
    });
  }

  function bindCopyIdButtons(root) {
    (root || document).querySelectorAll('[data-copy-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const gdId = el.getAttribute('data-copy-id');
        if (navigator.clipboard && gdId) {
          navigator.clipboard.writeText(gdId);
        }
        showToast(`Đã copy Level ID "${gdId}"! Dán vào thanh tìm kiếm trong Geometry Dash để chơi.`);
      });
    });
  }

  // Điều hướng Tab (Hồ sơ | Gợi ý & lộ trình | Diễn đàn) & Cập nhật Sidebar Danh mục
  const TAB_META = {
    profile: {
      breadcrumb: 'Trang chủ / Hồ sơ',
      title: 'Chơi đúng màn, tiến bộ mỗi ngày',
      subtitle: 'Cho web biết trình độ của bạn, nhận gợi ý màn vừa sức và lộ trình luyện tới màn mơ ước.',
      toc: [
        { href: '#sec-quick-challenge', label: '1. Thử thách nhanh' },
        { href: '#sec-self-assess', label: '2. Tự đánh giá kỹ năng' },
        { href: '#sec-completed-levels', label: '3. Màn bạn đã qua' },
        { href: '#sec-current-profile', label: '4. Trình độ hiện tại' }
      ]
    },
    recommend: {
      breadcrumb: 'Trang chủ / Gợi ý & lộ trình',
      title: 'Gợi ý vừa sức & Lộ trình tới màn mơ ước',
      subtitle: 'Thuật toán so khớp vector 8 kỹ năng để chọn màn cao hơn trình độ 10%–20% kèm Death Heatmap.',
      toc: [
        { href: '#sec-sweetspot', label: '1. Màn gợi ý vừa sức' },
        { href: '#sec-roadmap', label: '2. Lộ trình màn mục tiêu' },
        { href: '#sec-weekly', label: '3. Thử thách tuần & Bạn bè' },
        { href: '#sec-demon-explorer', label: '4. Kho 3,000+ Demon' }
      ]
    },
    forum: {
      breadcrumb: 'Trang chủ / Diễn đàn',
      title: 'Cộng đồng & Guide Geometry Dash',
      subtitle: 'Chia sẻ kinh nghiệm, mẹo vượt nút thắt (choke point), hỏi đáp và bình chọn độ khó chuẩn.',
      toc: [
        { href: '#sec-forum-create', label: '1. Đăng bài / Chia sẻ guide' },
        { href: '#sec-forum-feed', label: '2. Bảng tin & Thảo luận' }
      ]
    }
  };

  function switchTab(tabName) {
    state.activeTab = tabName;
    saveState();

    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.tab-view').forEach((view) => {
      view.classList.toggle('active', view.id === `tab-view-${tabName}`);
    });

    const meta = TAB_META[tabName] || TAB_META.profile;
    const bcEl = document.getElementById('hero-breadcrumb');
    const titleEl = document.getElementById('hero-title');
    const subEl = document.getElementById('hero-subtitle');
    const tocListEl = document.getElementById('toc-list');

    if (bcEl) bcEl.textContent = meta.breadcrumb;
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.subtitle;
    if (tocListEl) {
      tocListEl.innerHTML = meta.toc
        .map((item) => `<li><a href="${item.href}" class="toc-link">${item.label}</a></li>`)
        .join('');
    }

    if (tabName === 'profile') {
      renderCurrentProfileSection();
    } else if (tabName === 'recommend') {
      renderRecommendationsAndRoadmap();
    } else if (tabName === 'forum') {
      renderForum();
    }
  }

  // Hiệu ứng nền bầu trời sao (Starfield Canvas) giống hệt ảnh mẫu
  function initStarfield() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 135 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.7 + 0.5,
        alpha: Math.random() * 0.75 + 0.2,
        speed: Math.random() * 0.015 + 0.004
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.alpha += s.speed;
        if (s.alpha > 0.95 || s.alpha < 0.2) s.speed = -s.speed;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.15, Math.min(0.95, s.alpha))})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // Khởi tạo toàn bộ sự kiện khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', () => {
    initStarfield();

    // Theme selector
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = state.theme || 'default';
      document.body.setAttribute('data-theme', state.theme || 'default');
      themeSelect.addEventListener('change', (e) => {
        state.theme = e.target.value;
        document.body.setAttribute('data-theme', state.theme);
        saveState();
      });
    }

    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Nút chuyển sang Gợi ý & Lộ trình từ mục 4
    const jumpRecBtn = document.getElementById('btn-jump-recommend');
    if (jumpRecBtn) {
      jumpRecBtn.addEventListener('click', () => {
        switchTab('recommend');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Nút thu gọn/mở rộng Danh mục (Sidebar TOC)
    const tocToggleBtn = document.getElementById('toc-toggle-btn');
    if (tocToggleBtn) {
      tocToggleBtn.addEventListener('click', () => {
        const list = document.getElementById('toc-list');
        if (list) list.classList.toggle('collapsed');
      });
    }

    // Khởi tạo Mini-games cho 6 nút Thử thách nhanh
    window.GDMiniGames.init((skillKey, newBestScore) => {
      state.skills[skillKey] = newBestScore;
      saveState();
      renderQuickChallengeButtons();
      renderSkillSliders();
      renderCurrentProfileSection();
      renderRecommendationsAndRoadmap();
      showToast(`Đã cập nhật chỉ số ${skillKey.toUpperCase()} = ${newBestScore}/100 vào hồ sơ!`);
    });

    const qcModes = ['timing', 'spam_click', 'wave', 'ship', 'ufo', 'rhythm'];
    qcModes.forEach((mode) => {
      const btn = document.getElementById(`qc-btn-${mode}`);
      if (btn) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.qc-btn').forEach((b) => b.classList.remove('active-game'));
          btn.classList.add('active-game');
          window.GDMiniGames.openMode(mode, state.skills[mode]);
        });
      }
    });

    const closeGameBtn = document.getElementById('btn-close-minigame');
    if (closeGameBtn) {
      closeGameBtn.addEventListener('click', () => {
        document.querySelectorAll('.qc-btn').forEach((b) => b.classList.remove('active-game'));
        window.GDMiniGames.close();
      });
    }

    // Nút chọn Preset hồ sơ mẫu
    document.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        const preset = window.GD_PRESETS[key];
        if (!preset) return;
        state.skills = { ...preset.scores };
        saveState();
        renderQuickChallengeButtons();
        renderSkillSliders();
        renderCurrentProfileSection();
        renderRecommendationsAndRoadmap();
        showToast(`Đã áp dụng hồ sơ mẫu: ${preset.name}`);
      });
    });

    // Form thêm màn đã chơi
    const addLogBtn = document.getElementById('btn-add-playlog');
    if (addLogBtn) {
      addLogBtn.addEventListener('click', () => {
        const sel = document.getElementById('history-level-select');
        const progInput = document.getElementById('history-progress-input');
        const attInput = document.getElementById('history-attempts-input');
        const levelId = sel ? sel.value : 'lvl_clubstep';
        const progress = Math.max(1, Math.min(100, Number(progInput ? progInput.value : 100)));
        const attempts = Math.max(1, Number(attInput ? attInput.value : 150));
        addPlayHistoryEntry(levelId, progress, attempts);
        showToast('Đã thêm vào lịch sử chơi và cập nhật Elo kỹ năng!');
      });
    }

    // Chọn màn mục tiêu trong Lộ trình
    const updateRoadmapBtn = document.getElementById('btn-generate-roadmap');
    if (updateRoadmapBtn) {
      updateRoadmapBtn.addEventListener('click', () => {
        const sel = document.getElementById('roadmap-target-select');
        const daysInput = document.getElementById('roadmap-days-input');
        if (sel) state.targetLevelId = sel.value;
        if (daysInput) state.targetDays = Number(daysInput.value || 30);
        saveState();
        renderTargetRoadmap();
        showToast('Đã tạo lộ trình Challenge mới theo màn mục tiêu của bạn!');
      });
    }

    // Nút chia sẻ / so sánh hồ sơ với bạn bè
    const shareBtn = document.getElementById('btn-share-profile');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const rating = getOverallRating();
        const summary = `🎮 Hồ sơ GD ANALYZE của tôi (${rating}/100 Elo): Timing ${state.skills.timing} | Spam ${state.skills.spam_click} | Wave ${state.skills.wave} | Ship ${state.skills.ship} | UFO ${state.skills.ufo} | Nhịp ${state.skills.rhythm}`;
        if (navigator.clipboard) navigator.clipboard.writeText(summary);
        showToast('Đã copy thẻ Hồ sơ kỹ năng để chia sẻ lên Discord / Facebook!');
      });
    }

    // Sự kiện Diễn đàn: Lọc tag, tìm kiếm, đăng bài mới
    document.querySelectorAll('[data-forum-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-forum-tag]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentForumFilter = btn.getAttribute('data-forum-tag');
        renderForum();
      });
    });

    const forumSearch = document.getElementById('forum-search-input');
    if (forumSearch) {
      forumSearch.addEventListener('input', () => renderForum());
    }

    const createPostBtn = document.getElementById('btn-publish-post');
    if (createPostBtn) {
      createPostBtn.addEventListener('click', () => {
        const titleEl = document.getElementById('post-title-input');
        const contentEl = document.getElementById('post-content-input');
        const tagEl = document.getElementById('post-tag-select');
        const levelEl = document.getElementById('post-level-select');

        if (!titleEl || !contentEl || !titleEl.value.trim() || !contentEl.value.trim()) {
          showToast('Vui lòng nhập tiêu đề và nội dung bài viết!');
          return;
        }

        const chosenLvl = window.GD_LEVELS.find((l) => l.id === (levelEl ? levelEl.value : ''));
        state.forumPosts.unshift({
          id: 'post_' + Date.now(),
          author: 'Bạn (GD Dasher)',
          authorBadge: `Elo ${getOverallRating()}/100 • Thành viên tích cực`,
          level_id: chosenLvl ? chosenLvl.id : null,
          level_name: chosenLvl ? `${chosenLvl.name} (ID: ${chosenLvl.gd_level_id})` : null,
          title: titleEl.value.trim(),
          content: contentEl.value.trim(),
          tags: [tagEl ? tagEl.value : '#Guide', chosenLvl ? `#${chosenLvl.name.replace(/\s+/g, '')}` : '#GeometryDash'],
          upvotes: 1,
          createdAt: 'Vừa xong',
          comments: []
        });

        titleEl.value = '';
        contentEl.value = '';
        saveState();
        renderForum();
        showToast('Đã đăng bài viết lên Diễn đàn cộng đồng GD ANALYZE!');
      });
    }

    // Populate dropdown màn chơi trong form đăng bài diễn đàn
    const postLevelSelect = document.getElementById('post-level-select');
    if (postLevelSelect) {
      window.GD_LEVELS.filter((l) => !l.is_challenge).forEach((lvl) => {
        const opt = document.createElement('option');
        opt.value = lvl.id;
        opt.textContent = `${lvl.name} (ID: ${lvl.gd_level_id})`;
        postLevelSelect.appendChild(opt);
      });
    }

    // Kho dữ liệu 1.000 màn chơi Demon ngẫu nhiên (Tìm kiếm, Lọc hạng, Phân trang)
    let catalogPage = 1;
    const CATALOG_PAGE_SIZE = 12;

    function renderDemonCatalog() {
      const listEl = document.getElementById('catalog-list');
      const totalBadge = document.getElementById('catalog-total-count');
      const statsBar = document.getElementById('catalog-stats-bar');
      const pageInfo = document.getElementById('catalog-page-info');
      const searchEl = document.getElementById('catalog-search-input');
      const tierEl = document.getElementById('catalog-tier-select');
      if (!listEl) return;

      const allDemons = window.GD_LEVELS.filter((l) => !l.is_challenge);
      if (totalBadge) totalBadge.textContent = allDemons.length.toLocaleString('vi-VN');

      const q = (searchEl ? searchEl.value : '').trim().toLowerCase();
      const tier = tierEl ? tierEl.value : 'ALL';

      const filtered = allDemons.filter((l) => {
        const matchTier = tier === 'ALL' || l.diff_tier === tier;
        const matchQuery =
          !q ||
          l.name.toLowerCase().includes(q) ||
          (l.creator && l.creator.toLowerCase().includes(q)) ||
          String(l.gd_level_id).includes(q);
        return matchTier && matchQuery;
      });

      const totalPages = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
      if (catalogPage > totalPages) catalogPage = totalPages;
      const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
      const pageItems = filtered.slice(start, start + CATALOG_PAGE_SIZE);

      if (statsBar) {
        statsBar.textContent = `Tìm thấy ${filtered.length.toLocaleString('vi-VN')} màn chơi Demon phù hợp (hiển thị ${pageItems.length} màn/trang).`;
      }
      if (pageInfo) {
        pageInfo.textContent = `Trang ${catalogPage} / ${totalPages}`;
      }

      listEl.innerHTML = pageItems
        .map(
          (lvl) => `
          <div class="skill-slider-item" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
                <span class="diff-pill diff-${lvl.diff_tier}">${lvl.official_difficulty}</span>
                <span class="level-id-pill" data-copy-id="${lvl.gd_level_id}" title="Click để copy ID">ID: ${lvl.gd_level_id} 📋</span>
              </div>
              <div style="font-weight: 800; font-size: 1rem; margin-bottom: 3px;">${lvl.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">
                Tác giả: <strong>${lvl.creator}</strong> • ${lvl.community_difficulty}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">
                Timing ${lvl.skills.timing} • Wave ${lvl.skills.wave} • Ship ${lvl.skills.ship} • UFO ${lvl.skills.ufo}
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <button class="btn-secondary btn-set-catalog-target" data-level-id="${lvl.id}" style="flex: 1; padding: 6px 10px; font-size: 0.78rem;">
                🎯 Đặt làm mục tiêu
              </button>
              <button class="btn-primary btn-log-catalog-level" data-level-id="${lvl.id}" style="padding: 6px 10px; font-size: 0.78rem;">
                + Đã qua
              </button>
            </div>
          </div>`
        )
        .join('');

      bindCopyIdButtons(listEl);

      listEl.querySelectorAll('.btn-set-catalog-target').forEach((btn) => {
        btn.addEventListener('click', () => {
          const lid = btn.getAttribute('data-level-id');
          state.targetLevelId = lid;
          const sel = document.getElementById('roadmap-target-select');
          if (sel) sel.value = lid;
          saveState();
          renderTargetRoadmap();
          showToast('Đã đặt màn này làm mục tiêu trong Lộ trình Challenge!');
          document.getElementById('sec-roadmap')?.scrollIntoView({ behavior: 'smooth' });
        });
      });

      listEl.querySelectorAll('.btn-log-catalog-level').forEach((btn) => {
        btn.addEventListener('click', () => {
          const lid = btn.getAttribute('data-level-id');
          addPlayHistoryEntry(lid, 100, 200);
          showToast('Đã lưu hoàn thành màn và cập nhật điểm Elo!');
        });
      });
    }

    document.getElementById('catalog-search-input')?.addEventListener('input', () => {
      catalogPage = 1;
      renderDemonCatalog();
    });
    document.getElementById('catalog-tier-select')?.addEventListener('change', () => {
      catalogPage = 1;
      renderDemonCatalog();
    });
    document.getElementById('catalog-prev-btn')?.addEventListener('click', () => {
      if (catalogPage > 1) {
        catalogPage--;
        renderDemonCatalog();
      }
    });
    document.getElementById('catalog-next-btn')?.addEventListener('click', () => {
      catalogPage++;
      renderDemonCatalog();
    });

    // Render toàn bộ giao diện lần đầu
    renderQuickChallengeButtons();
    renderSkillSliders();
    renderPlayHistory();
    renderCurrentProfileSection();
    renderRecommendationsAndRoadmap();
    renderDemonCatalog();
    renderForum();
    switchTab(state.activeTab || 'profile');
  });
})();
