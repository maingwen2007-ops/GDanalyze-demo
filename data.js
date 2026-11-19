// Dữ liệu nền tảng cho GD ANALYZE: Vector 8 Kỹ năng, Cơ sở dữ liệu Màn chơi Geometry Dash, Diễn đàn & Thử thách

window.GD_SKILLS = [
  {
    key: 'timing',
    label: 'Timing',
    shortLabel: 'Timing',
    icon: '⏱️',
    desc: 'Canh thời điểm nhảy/nhấn orb, jump pad, nhảy qua gai hẹp (frame-perfect / late jump)',
    defaultScore: 32,
    hasMiniGame: true
  },
  {
    key: 'spam_click',
    label: 'Spam click',
    shortLabel: 'Spam click',
    icon: '⚡',
    desc: 'Tốc độ nhấp liên tục cường độ cao (CPS), spam orb, mini-wave spam',
    defaultScore: 47,
    hasMiniGame: true
  },
  {
    key: 'wave',
    label: 'Wave',
    shortLabel: 'Wave',
    icon: '〰️',
    desc: 'Điều khiển gamemode Wave zigzag góc 45°/60°, mini wave, hành lang hẹp',
    defaultScore: 48,
    hasMiniGame: true
  },
  {
    key: 'ship',
    label: 'Ship',
    shortLabel: 'Ship',
    icon: '🚀',
    desc: 'Giữ thăng bằng gamemode Ship, straight fly, đổi trọng lực (gravity portal)',
    defaultScore: 100,
    hasMiniGame: true
  },
  {
    key: 'ufo',
    label: 'UFO',
    shortLabel: 'UFO',
    icon: '🛸',
    desc: 'Canh nhịp nhảy bậc thang trên không với gamemode UFO qua cổng hẹp',
    defaultScore: 100,
    hasMiniGame: true
  },
  {
    key: 'rhythm',
    label: 'Nhịp (Rhythm)',
    shortLabel: 'Nhịp',
    icon: '🎵',
    desc: 'Bắt nhịp click đồng bộ theo beat nhạc nền (music sync & flow gameplay)',
    defaultScore: 79,
    hasMiniGame: true
  },
  {
    key: 'accuracy',
    label: 'Độ chính xác',
    shortLabel: 'Chính xác',
    icon: '🎯',
    desc: 'Kiểm soát sai số vị trí nhỏ, micro-click và né hitbox gai sát',
    defaultScore: 62,
    hasMiniGame: false
  },
  {
    key: 'consistency',
    label: 'Độ ổn định',
    shortLabel: 'Ổn định',
    icon: '🛡️',
    desc: 'Giữ tâm lý và phong độ đều qua các màn dài (XL/Long), ít chết vặt ở cuối màn',
    defaultScore: 58,
    hasMiniGame: false
  }
];

window.GD_PRESETS = {
  screenshot: {
    name: 'Mặc định (Từ bài test)',
    scores: { timing: 32, spam_click: 47, wave: 48, ship: 100, ufo: 100, rhythm: 79, accuracy: 62, consistency: 58 }
  },
  newbie: {
    name: 'Newbie (Mới chơi)',
    scores: { timing: 22, spam_click: 28, wave: 18, ship: 30, ufo: 25, rhythm: 35, accuracy: 20, consistency: 25 }
  },
  easy_demon: {
    name: 'Easy Demon Hunter',
    scores: { timing: 48, spam_click: 52, wave: 45, ship: 58, ufo: 54, rhythm: 62, accuracy: 50, consistency: 52 }
  },
  hard_demon: {
    name: 'Hard / Insane Demon',
    scores: { timing: 76, spam_click: 72, wave: 82, ship: 78, ufo: 75, rhythm: 80, accuracy: 77, consistency: 74 }
  },
  extreme: {
    name: 'Extreme Slayer',
    scores: { timing: 94, spam_click: 90, wave: 95, ship: 96, ufo: 92, rhythm: 91, accuracy: 95, consistency: 93 }
  }
};

window.GD_LEVELS = [
  {
    id: 'lvl_the_nightmare',
    gd_level_id: '13519',
    name: 'The Nightmare',
    creator: 'Jax',
    official_difficulty: 'Easy Demon',
    community_difficulty: '7★ Harder (Dễ hơn Demon chuẩn)',
    diff_tier: 'easy',
    overall_difficulty: 28,
    is_challenge: false,
    skills: { timing: 25, spam_click: 20, wave: 10, ship: 35, ufo: 25, rhythm: 30, accuracy: 28, consistency: 30 },
    choke_point: '55% - 68% (Đoạn Ship đảo trọng lực và chuỗi nhảy Cube)',
    choke_tip: 'Giữ nhịp tap nhẹ ở đoạn mini-ship 56%, đừng giữ chuột quá lâu khi qua cổng vàng.',
    heatmap: [10, 15, 35, 25, 15],
    tags: ['#EasyDemon', '#Newbie', '#Ship', '#Classic']
  },
  {
    id: 'lvl_phjork',
    gd_level_id: '65904102',
    name: 'phjork',
    creator: 'cerufiffy',
    official_difficulty: 'Easy Demon',
    community_difficulty: 'Easy Demon (Chuẩn nhập môn hiện đại)',
    diff_tier: 'easy',
    overall_difficulty: 36,
    is_challenge: false,
    skills: { timing: 34, spam_click: 35, wave: 38, ship: 40, ufo: 42, rhythm: 75, accuracy: 36, consistency: 40 },
    choke_point: '42% - 58% (Đoạn Drop chuyển gamemode nhanh theo nhạc)',
    choke_tip: 'Màn này sync 100% theo nhạc! Hãy bật tiếng và bấm đúng theo tiếng snare của bài nhạc.',
    heatmap: [12, 22, 42, 16, 8],
    tags: ['#EasyDemon', '#Rhythm', '#Flow', '#Modern']
  },
  {
    id: 'lvl_clubstep',
    gd_level_id: '14',
    name: 'Clubstep (Official)',
    creator: 'RobTop',
    official_difficulty: 'Easy Demon',
    community_difficulty: 'Easy Demon',
    diff_tier: 'easy',
    overall_difficulty: 45,
    is_challenge: false,
    skills: { timing: 45, spam_click: 35, wave: 20, ship: 72, ufo: 65, rhythm: 55, accuracy: 58, consistency: 52 },
    choke_point: '79% - 90% (Mini Ship đảo trọng lực liên tục qua hàm răng quái vật)',
    choke_tip: 'Bạn rất mạnh Ship & UFO nên đoạn 79% sẽ là lợi thế lớn; chỉ cần tập kỹ các fake orb ở 30%–45%.',
    heatmap: [15, 20, 15, 38, 12],
    tags: ['#EasyDemon', '#RobTop', '#Ship', '#UFO']
  },
  {
    id: 'lvl_deadlocked',
    gd_level_id: '20',
    name: 'Deadlocked (Official)',
    creator: 'RobTop',
    official_difficulty: 'Easy Demon',
    community_difficulty: 'High Easy / Low Medium Demon',
    diff_tier: 'medium',
    overall_difficulty: 56,
    is_challenge: false,
    skills: { timing: 52, spam_click: 68, wave: 72, ship: 65, ufo: 60, rhythm: 66, accuracy: 60, consistency: 58 },
    choke_point: '13% & 73% (Hai đoạn Dual/Mini Wave tốc độ 3x)',
    choke_tip: 'Luyện riêng đoạn Wave 13% và 73% trong Start Pos. Giữ nhịp spam đều 6-7 CPS thay vì bấm loạn.',
    heatmap: [34, 12, 14, 30, 10],
    tags: ['#EasyDemon', '#Wave', '#Spam', '#RobTop']
  },
  {
    id: 'lvl_decode',
    gd_level_id: '2997354',
    name: 'DeCode',
    creator: 'Rek3dge',
    official_difficulty: 'Easy Demon',
    community_difficulty: 'High Easy Demon',
    diff_tier: 'easy',
    overall_difficulty: 54,
    is_challenge: false,
    skills: { timing: 58, spam_click: 52, wave: 74, ship: 62, ufo: 68, rhythm: 65, accuracy: 66, consistency: 60 },
    choke_point: '64% (UFO nhịp phức tạp) & 85% (Hành lang Wave huyền thoại)',
    choke_tip: 'Ở 85% Wave tốc độ 0.5x trông rất hẹp nhưng tốc độ chậm, hãy nhìn trước đầu mũi tên 1 ô lưới.',
    heatmap: [10, 15, 28, 17, 30],
    tags: ['#EasyDemon', '#Wave', '#Timing', '#Accuracy']
  },
  {
    id: 'lvl_problematic',
    gd_level_id: '7116121',
    name: 'Problematic',
    creator: 'Dhafin',
    official_difficulty: 'Easy Demon',
    community_difficulty: 'Easy Demon (Nine Circles nhập môn)',
    diff_tier: 'easy',
    overall_difficulty: 50,
    is_challenge: false,
    skills: { timing: 44, spam_click: 50, wave: 70, ship: 48, ufo: 40, rhythm: 55, accuracy: 56, consistency: 50 },
    choke_point: '18% (Cube timing đầu màn) & 48%-75% (Nine Circles Wave)',
    choke_tip: 'Màn tốt nhất để nâng Wave từ ~48 lên 70 trước khi tiến lên Jawbreaker hoặc Nine Circles.',
    heatmap: [32, 12, 30, 18, 8],
    tags: ['#EasyDemon', '#Wave', '#NineCircles']
  },
  {
    id: 'lvl_b',
    gd_level_id: '34085027',
    name: 'B',
    creator: 'Motleyorc & ScorchVx',
    official_difficulty: 'Medium Demon',
    community_difficulty: 'Low Medium Demon',
    diff_tier: 'medium',
    overall_difficulty: 60,
    is_challenge: false,
    skills: { timing: 58, spam_click: 64, wave: 56, ship: 62, ufo: 66, rhythm: 78, accuracy: 62, consistency: 64 },
    choke_point: '62% - 76% (Đoạn Ball/Spider tốc độ 4x) & 88% (Green Orb timing cuối màn)',
    choke_tip: 'Ở 88% đừng bấm các green orb quá sớm, đợi icon chạm giữa orb mới click.',
    heatmap: [12, 18, 28, 26, 16],
    tags: ['#MediumDemon', '#Rhythm', '#Spam', '#Timing']
  },
  {
    id: 'lvl_verity',
    gd_level_id: '17775654',
    name: 'Verity',
    creator: 'Serponge',
    official_difficulty: 'Medium Demon',
    community_difficulty: 'Medium Demon',
    diff_tier: 'medium',
    overall_difficulty: 64,
    is_challenge: false,
    skills: { timing: 55, spam_click: 54, wave: 62, ship: 85, ufo: 76, rhythm: 70, accuracy: 72, consistency: 68 },
    choke_point: '78% - 96% (Dual Ship + Straight Fly hẹp cuối màn)',
    choke_tip: 'Cực kỳ hợp với người chơi có Ship & UFO cao (100) nhưng muốn kéo Timing và Wave lên đều.',
    heatmap: [10, 12, 16, 22, 40],
    tags: ['#MediumDemon', '#Ship', '#UFO', '#Consistency']
  },
  {
    id: 'lvl_hell',
    gd_level_id: '20545653',
    name: 'HeLL',
    creator: 'Serponge',
    official_difficulty: 'Medium Demon',
    community_difficulty: 'High Medium Demon',
    diff_tier: 'medium',
    overall_difficulty: 69,
    is_challenge: false,
    skills: { timing: 68, spam_click: 66, wave: 78, ship: 74, ufo: 70, rhythm: 72, accuracy: 74, consistency: 68 },
    choke_point: '22% - 42% (Đoạn Wave tốc độ nhanh đầu drop)',
    choke_tip: 'Qua được 45% là tỷ lệ thắng rất cao. Hãy tập trung luyện kiểm soát Wave 3x ở đầu drop.',
    heatmap: [18, 42, 16, 14, 10],
    tags: ['#MediumDemon', '#Wave', '#Timing']
  },
  {
    id: 'lvl_nine_circles',
    gd_level_id: '4284013',
    name: 'Nine Circles',
    creator: 'Zobros',
    official_difficulty: 'Hard Demon',
    community_difficulty: 'Hard Demon (Chuẩn mực kỹ năng Wave)',
    diff_tier: 'hard',
    overall_difficulty: 75,
    is_challenge: false,
    skills: { timing: 72, spam_click: 70, wave: 88, ship: 68, ufo: 55, rhythm: 74, accuracy: 80, consistency: 76 },
    choke_point: '40% - 82% (Đoạn Wave chớp sáng Nine Circles & Mini-wave đảo chiều 73%)',
    choke_tip: 'Ở 73% khi vào cổng mini-wave ngược, hãy nhả chuột sớm hơn nửa nhịp để tránh đâm trần.',
    heatmap: [12, 14, 34, 28, 12],
    tags: ['#HardDemon', '#Wave', '#Timing', '#NineCircles']
  },
  {
    id: 'lvl_future_funk',
    gd_level_id: '34060555',
    name: 'Future Funk',
    creator: 'JonathanGD',
    official_difficulty: 'Hard Demon',
    community_difficulty: 'Hard Demon (XL - Thử thách Độ ổn định)',
    diff_tier: 'hard',
    overall_difficulty: 77,
    is_challenge: false,
    skills: { timing: 76, spam_click: 60, wave: 68, ship: 75, ufo: 72, rhythm: 86, accuracy: 76, consistency: 92 },
    choke_point: '62% (Dual bất đối xứng) & 99% (3 cú nhảy Timing cuối cùng)',
    choke_tip: 'Luyện thuộc lòng đoạn Dual 62% và 3 cú click 99% ít nhất 20 lần liên tiếp trước khi chạy từ 0%.',
    heatmap: [8, 12, 32, 13, 35],
    tags: ['#HardDemon', '#Consistency', '#Timing', '#Rhythm']
  },
  {
    id: 'lvl_windy_landscape',
    gd_level_id: '4957691',
    name: 'Windy Landscape',
    creator: 'WOOGI1411',
    official_difficulty: 'Insane Demon',
    community_difficulty: 'Entry Insane Demon',
    diff_tier: 'insane',
    overall_difficulty: 83,
    is_challenge: false,
    skills: { timing: 84, spam_click: 72, wave: 76, ship: 88, ufo: 82, rhythm: 85, accuracy: 84, consistency: 82 },
    choke_point: '27% - 34% (Ship giữ độ cao qua dốc hẹp + Orb timing)',
    choke_tip: 'Với chỉ số Ship 100 của bạn, bạn chỉ cần nâng Timing và Wave lên ~75 là đủ sức chinh phục màn này.',
    heatmap: [18, 38, 18, 14, 12],
    tags: ['#InsaneDemon', '#Ship', '#Timing', '#Rhythm']
  },
  {
    id: 'lvl_acu',
    gd_level_id: '61079355',
    name: 'Acu',
    creator: 'neigefeu',
    official_difficulty: 'Extreme Demon',
    community_difficulty: 'Entry Extreme Demon',
    diff_tier: 'extreme',
    overall_difficulty: 91,
    is_challenge: false,
    skills: { timing: 92, spam_click: 84, wave: 86, ship: 82, ufo: 88, rhythm: 95, accuracy: 90, consistency: 90 },
    choke_point: '0% - 26% (Pre-drop Timing cực gắt) & 71% (Wave + Post-drop timing)',
    choke_tip: 'Màn Extreme đầu tay lý tưởng cho người mạnh Nhịp (Rhythm). Hãy luyện kỹ Timing pre-drop trước.',
    heatmap: [35, 15, 15, 22, 13],
    tags: ['#ExtremeDemon', '#Timing', '#Rhythm', '#Flow']
  },
  {
    id: 'lvl_bloodbath',
    gd_level_id: '10565740',
    name: 'Bloodbath',
    creator: 'Riot & More',
    official_difficulty: 'Extreme Demon',
    community_difficulty: 'Mid Extreme Demon',
    diff_tier: 'extreme',
    overall_difficulty: 97,
    is_challenge: false,
    skills: { timing: 95, spam_click: 90, wave: 94, ship: 99, ufo: 94, rhythm: 86, accuracy: 98, consistency: 97 },
    choke_point: '25% - 33% (Michigun UFO + Triple Spikes) & 71% - 80% (Etzer)',
    choke_tip: 'Yêu cầu Straight Fly (Ship) và Timing đỉnh cao ở phần Michigun và Crack.',
    heatmap: [15, 34, 22, 19, 10],
    tags: ['#ExtremeDemon', '#Ship', '#Timing', '#Accuracy']
  },
  // Các màn Challenge ngắn phục vụ Lộ trình luyện tập chuyên sâu theo từng kỹ năng thiếu
  {
    id: 'chal_timing_1',
    gd_level_id: '78234110',
    name: 'Challenge: Precision Jumps I',
    creator: 'GDAnalyzeLab',
    official_difficulty: 'Challenge (Ngắn 25s)',
    community_difficulty: 'Luyện Timing cơ bản → trung cấp',
    diff_tier: 'easy',
    overall_difficulty: 42,
    is_challenge: true,
    focus_skill: 'timing',
    skills: { timing: 55, spam_click: 20, wave: 15, ship: 20, ufo: 30, rhythm: 45, accuracy: 50, consistency: 40 },
    choke_point: 'Chuỗi 8 cú nhảy Late-Orb & Triple Spike',
    choke_tip: 'Nhìn vào chân icon chạm mép gai cuối cùng trước khi nhấn.',
    heatmap: [20, 20, 25, 20, 15],
    tags: ['#Challenge', '#Timing', '#Accuracy']
  },
  {
    id: 'chal_timing_2',
    gd_level_id: '81459203',
    name: 'Challenge: Micro Orb Mastery',
    creator: 'GDAnalyzeLab',
    official_difficulty: 'Challenge (Ngắn 30s)',
    community_difficulty: 'Luyện Timing nâng cao (Hard/Insane Demon)',
    diff_tier: 'hard',
    overall_difficulty: 68,
    is_challenge: true,
    focus_skill: 'timing',
    skills: { timing: 78, spam_click: 35, wave: 30, ship: 30, ufo: 45, rhythm: 60, accuracy: 75, consistency: 65 },
    choke_point: 'Cú nhảy Blue-orb + Pink-pad frame tight ở 65%',
    choke_tip: 'Bấm nhẹ (micro-click) khi vừa chạm rìa dưới của orb xanh.',
    heatmap: [15, 20, 35, 20, 10],
    tags: ['#Challenge', '#Timing', '#HardDemon']
  },
  {
    id: 'chal_wave_1',
    gd_level_id: '64120988',
    name: 'Challenge: Wave Corridor 45°',
    creator: 'WaveDojo',
    official_difficulty: 'Challenge (Ngắn 22s)',
    community_difficulty: 'Luyện Wave trung cấp (48 → 65)',
    diff_tier: 'medium',
    overall_difficulty: 52,
    is_challenge: true,
    focus_skill: 'wave',
    skills: { timing: 40, spam_click: 55, wave: 66, ship: 20, ufo: 20, rhythm: 50, accuracy: 62, consistency: 52 },
    choke_point: 'Chuyển từ Normal Wave sang Mini Wave tốc độ 2x',
    choke_tip: 'Giữ nhịp bấm đều đặn, mắt nhìn trước 2 thân răng cưa.',
    heatmap: [15, 25, 35, 15, 10],
    tags: ['#Challenge', '#Wave', '#Spam']
  },
  {
    id: 'chal_wave_2',
    gd_level_id: '73901452',
    name: 'Challenge: Mini Wave Consistent',
    creator: 'WaveDojo',
    official_difficulty: 'Challenge (Ngắn 28s)',
    community_difficulty: 'Luyện Wave nâng cao (65 → 85)',
    diff_tier: 'hard',
    overall_difficulty: 72,
    is_challenge: true,
    focus_skill: 'wave',
    skills: { timing: 60, spam_click: 72, wave: 84, ship: 25, ufo: 25, rhythm: 65, accuracy: 78, consistency: 70 },
    choke_point: 'Đoạn Wave ngược (Gravity Portal) ở 55%',
    choke_tip: 'Tập cảm giác nhả chuột = đi lên khi ở trong vùng trọng lực ngược.',
    heatmap: [10, 20, 40, 20, 10],
    tags: ['#Challenge', '#Wave', '#NineCircles']
  },
  {
    id: 'chal_spam_1',
    gd_level_id: '69881204',
    name: 'Challenge: Controlled Burst CPS',
    creator: 'SpamClinic',
    official_difficulty: 'Challenge (Ngắn 20s)',
    community_difficulty: 'Luyện Spam Click ổn định (47 → 72)',
    diff_tier: 'medium',
    overall_difficulty: 55,
    is_challenge: true,
    focus_skill: 'spam_click',
    skills: { timing: 45, spam_click: 74, wave: 64, ship: 30, ufo: 50, rhythm: 60, accuracy: 60, consistency: 58 },
    choke_point: '3 đoạn spam 7.5 CPS kéo dài 2.5 giây',
    choke_tip: 'Giữ cổ tay thả lỏng để spam đều biên độ thay vì bấm nhanh nhưng lệch nhịp.',
    heatmap: [20, 30, 30, 10, 10],
    tags: ['#Challenge', '#Spam', '#Wave']
  }
];

window.GD_INITIAL_FORUM_POSTS = [
  {
    id: 'post_1',
    author: 'VNGD_Dasher',
    authorBadge: 'Top 50 VN • 1,420 Uy tín',
    level_id: 'lvl_nine_circles',
    level_name: 'Nine Circles (ID: 4284013)',
    title: '[Guide Chi Tiết] Cách vượt qua đoạn Mini-Wave ngược 73% trong Nine Circles cho người yếu Wave',
    content: 'Rất nhiều bạn có Ship tốt nhưng bị kẹt ở Nine Circles vì chỉ số Wave mới ở mức 45–55. Bí quyết mình áp dụng để qua 73%:\n1. Đừng nhảy thẳng vào Nine Circles ngay: Hãy chạy Problematic (ID: 7116121) và Challenge Wave Corridor (ID: 64120988) trước.\n2. Ở 73%, ngay trước khi chạm cổng Gravity màu vàng, hãy nhả chuột sớm hơn 0.15s để icon trượt thẳng vào giữa khe hẹp.',
    tags: ['#NineCircles', '#Wave', '#HardDemon', '#Guide'],
    upvotes: 84,
    createdAt: '2 giờ trước',
    comments: [
      { author: 'CubeMaster99', text: 'Áp dụng mẹo nhả chuột sớm 0.15s ở 73% qua được luôn sau 40 attempts, cảm ơn bác!', time: '1 giờ trước' },
      { author: 'MinhWave', text: 'Chuẩn luôn, luyện Problematic trước giúp mắt quen hiệu ứng chớp sáng.', time: '35 phút trước' }
    ]
  },
  {
    id: 'post_2',
    author: 'CeruFan_VN',
    authorBadge: 'Creator & Guide Writer • 890 Uy tín',
    level_id: 'lvl_deadlocked',
    level_name: 'Deadlocked (ID: 20)',
    title: 'Phân tích 2 nút thắt Wave 13% và 73% của Deadlocked — Không cần spam quá nhanh!',
    content: 'Nhiều bạn tưởng Wave 13% của Deadlocked cần spam 10 CPS nhưng thực chất chỉ cần đúng 4 cú click có nhịp (Rhythm). Nếu bạn có chỉ số Nhịp (Rhythm) từ 70 trở lên, hãy đếm "1 - 2 - 3 - giữ nhẹ" theo đúng phách trống của nhạc nền!',
    tags: ['#Deadlocked', '#Wave', '#Spam', '#EasyDemon', '#Guide'],
    upvotes: 62,
    createdAt: '5 giờ trước',
    comments: [
      { author: 'NewbieGD', text: 'Trước giờ toàn bấm loạn ở 13%, để tối nay thử đếm nhịp 1-2-3 xem sao.', time: '3 giờ trước' }
    ]
  },
  {
    id: 'post_3',
    author: 'FlukeKing',
    authorBadge: 'Extreme Slayer • 2,150 Uy tín',
    level_id: 'lvl_clubstep',
    level_name: 'Clubstep (ID: 14)',
    title: 'Lộ trình cho người mạnh Ship & UFO (100 điểm) nhưng yếu Timing (~30-40 điểm)',
    content: 'Mình thấy nhiều bạn test thử thách nhanh đạt 100 điểm Ship và UFO nhưng Timing mới ~32 và Wave ~48. Với hồ sơ này, bạn sẽ cực kỳ bá đạo ở Clubstep (79%-90% toàn là Ship) và Verity, nhưng sẽ hay chết vặt ở các cú nhảy Cube đầu màn. Hãy ghép 10 phút tập Challenge Precision Jumps (ID: 78234110) mỗi ngày!',
    tags: ['#Clubstep', '#Timing', '#Ship', '#UFO', '#ChiaSẻ'],
    upvotes: 95,
    createdAt: '1 ngày trước',
    comments: [
      { author: 'DasherHaNoi', text: 'Đúng y hệt hồ sơ của mình luôn (Timing 32, Ship 100, UFO 100)!', time: '18 giờ trước' }
    ]
  },
  {
    id: 'post_4',
    author: 'JonathanFan',
    authorBadge: 'XL Marathoner • 740 Uy tín',
    level_id: 'lvl_future_funk',
    level_name: 'Future Funk (ID: 34060555)',
    title: '[Hỏi đáp & Mẹo] Làm sao giữ bình tĩnh ở 99% Future Funk khi nhịp tim lên 150 BPM?',
    content: 'Màn dài hơn 4 phút nên yếu tố quyết định là Độ ổn định (Consistency) và Timing ở 99%. Mẹo của mình là đặt Start Pos ở 90%, bật nhạc và qua đoạn 90-100% đủ 15 lần liên tiếp không chết lần nào trước khi chơi từ 0%.',
    tags: ['#FutureFunk', '#Consistency', '#Timing', '#HardDemon'],
    upvotes: 51,
    createdAt: '2 ngày trước',
    comments: []
  }
];

window.GD_WEEKLY_CHALLENGES = [
  {
    id: 'wk_1',
    title: 'Thử thách Tuần: Nâng cấp Timing & Wave',
    desc: 'Vượt qua Challenge "Precision Jumps I" (ID: 78234110) và đạt ít nhất 65% ở "Problematic" (ID: 7116121).',
    rewardBadge: '🏅 Huy hiệu Wave & Timing Tuần 46',
    daysLeft: 4,
    participants: 318
  },
  {
    id: 'wk_2',
    title: 'Mục tiêu Tháng: Chinh phục Medium Demon đầu tay',
    desc: 'Hoàn thành 100% màn "B" (ID: 34085027) hoặc "Verity" (ID: 17775654) trong vòng 30 ngày.',
    rewardBadge: '🏆 Slayer Medium Demon',
    daysLeft: 19,
    participants: 642
  }
];

// Gộp 7.000 màn chơi Demon ngẫu nhiên đã trích xuất từ Pointercrate & GDBrowser vào GD_LEVELS
const extractedBatches = [
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS) ? window.GD_EXTRACTED_DEMONS : []),
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS_2) ? window.GD_EXTRACTED_DEMONS_2 : []),
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS_3) ? window.GD_EXTRACTED_DEMONS_3 : []),
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS_4) ? window.GD_EXTRACTED_DEMONS_4 : []),
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS_5) ? window.GD_EXTRACTED_DEMONS_5 : []),
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS_6) ? window.GD_EXTRACTED_DEMONS_6 : []),
  ...(Array.isArray(window.GD_EXTRACTED_DEMONS_7) ? window.GD_EXTRACTED_DEMONS_7 : [])
];
if (extractedBatches.length > 0) {
  const existingIds = new Set(window.GD_LEVELS.map((l) => String(l.gd_level_id)));
  extractedBatches.forEach((d) => {
    if (!existingIds.has(String(d.gd_level_id))) {
      existingIds.add(String(d.gd_level_id));
      window.GD_LEVELS.push(d);
    }
  });
}
