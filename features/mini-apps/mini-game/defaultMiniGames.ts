const createGameSource = (title: string, description: string) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: var(--va-font-active); color: var(--va-color-foreground); background: radial-gradient(circle at top, var(--va-color-primary-soft), transparent 36%), var(--va-color-background); }
    main { min-height: 520px; display: grid; place-items: center; padding: 32px 16px; }
    .game { width: min(760px, 100%); border: 1px solid color-mix(in srgb, var(--va-color-primary) 22%, transparent); border-radius: 28px; padding: 28px; background: color-mix(in srgb, var(--va-color-surface) 92%, transparent); box-shadow: 0 24px 80px rgba(15,23,42,.14); }
    .badge { display: inline-flex; border-radius: 999px; padding: 6px 12px; background: var(--va-color-primary-soft); color: var(--va-color-primary); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    h1 { margin: 18px 0 10px; font-size: clamp(32px, 8vw, 72px); line-height: .92; letter-spacing: -.06em; }
    p { max-width: 620px; color: var(--va-color-muted); line-height: 1.7; }
    .board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 24px; }
    button { min-height: 72px; border: 0; border-radius: 18px; background: linear-gradient(135deg, var(--va-color-primary), var(--va-color-secondary)); color: var(--va-color-primary-foreground); font-size: 20px; font-weight: 900; cursor: pointer; box-shadow: 0 10px 24px rgba(15,23,42,.18); transition: transform .18s ease, opacity .18s ease; }
    button:hover { transform: translateY(-2px) scale(1.02); }
    button.done { opacity: .55; transform: scale(.96); }
    .status { margin-top: 18px; min-height: 28px; font-weight: 800; color: var(--va-color-primary); }
  </style>
</head>
<body>
  <main>
    <section class="game">
      <span class="badge">HTML5 Mini Game</span>
      <h1>${title}</h1>
      <p>${description}</p>
      <div class="board" id="board"></div>
      <div class="status" id="status">Chọn đủ các ô để ghi điểm.</div>
    </section>
  </main>
  <script>
    const board = document.getElementById('board');
    const status = document.getElementById('status');
    let score = 0;
    Array.from({ length: 12 }).forEach((_, index) => {
      const button = document.createElement('button');
      button.textContent = String(index + 1);
      button.addEventListener('click', () => {
        if (button.classList.contains('done')) return;
        button.classList.add('done');
        score += Math.ceil(Math.random() * 9);
        status.textContent = 'Điểm hiện tại: ' + score;
      });
      board.appendChild(button);
    });
  </script>
</body>
</html>`;

const game = (
  title: string,
  slug: string,
  order: number,
  category: 'Strategy' | 'Puzzle' | 'Arcade',
  image: string,
  desc: string,
) => ({
  _creationTime: 0,
  _id: `code-${slug}`,
  active: true,
  category,
  config: {
    allowForms: true,
    allowPopups: true,
    allowScripts: true,
    heightMode: 'auto',
    minHeight: 520,
    preview: desc,
    source: createGameSource(title, desc),
  },
  desc,
  image,
  order,
  slug,
  title,
});

export const DEFAULT_MINI_GAMES = [
  game('Cờ caro AI', 'co-caro-ai', 1, 'Strategy', '/images/games/caro.png', 'Đấu cờ caro chiến thuật đỉnh cao với AI thông minh ở nhiều cấp độ khó.'),
  game('Xiangqi', 'xiangqi', 2, 'Strategy', '/images/games/xiangqi.png', 'Trò chơi cờ tướng truyền thống đấu trí căng thẳng, so tài chiến lược sâu sắc.'),
  game('AI Chess', 'ai-chess', 3, 'Strategy', '/images/games/chess.png', 'Đấu cờ vua chuyên nghiệp với công cụ phân tích và gợi ý nước đi tối ưu.'),
  game('Minesweeper', 'minesweeper', 4, 'Puzzle', '/images/games/minesweeper.png', 'Trò chơi dò mìn cổ điển kết hợp hiệu ứng âm thanh và đồ họa cải tiến.'),
  game('Sudoku', 'sudoku', 5, 'Puzzle', '/images/games/sudoku.png', 'Điền số logic đầy thử thách trí não với hàng nghìn câu đố hóc búa.'),
  game('Tetris', 'tetris', 6, 'Arcade', '/images/games/tetris.png', 'Xếp gạch cổ điển, phản xạ nhanh tay để dọn hàng gạch và ghi điểm kỷ lục.'),
  game('Solitaire', 'solitaire', 7, 'Puzzle', '/images/games/solitaire.png', 'Trò chơi xếp bài tây Klondike kinh điển giúp bạn thư giãn đầu óc hiệu quả.'),
  game('Tower Defense', 'tower-defense', 8, 'Strategy', '/images/games/towerdefense.png', 'Xây dựng và nâng cấp tháp phòng thủ ngăn chặn làn sóng robot tấn công.'),
  game('2048', '2048', 9, 'Puzzle', '/images/games/game2048.png', 'Trượt các ô số thông minh để cộng dồn và đạt được cột mốc ô số 2048.'),
  game('Brick Breaker', 'brick-breaker', 10, 'Arcade', '/images/games/brickbreaker.png', 'Điều khiển thanh đỡ bắn bóng phá hủy các khối gạch màu sắc bắt mắt.'),
  game('Snake', 'snake', 11, 'Arcade', '/images/games/snake.png', 'Điều khiển rắn săn mồi ăn táo đỏ trong mê cung, tránh tự đâm vào thân.'),
  game('TowerStack', 'towerstack', 12, 'Arcade', '/images/games/towerstack.png', 'Thả các tầng tháp vật lý chồng lên nhau khéo léo để đạt độ cao tối đa.'),
] as const;
