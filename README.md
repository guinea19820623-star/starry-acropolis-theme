# Claude Desktop 星空外觀 · Starry Theme

<img src="tools/scene.preview.svg" alt="星空、流星雨與山丘上點亮的古希臘衛城" width="720">

替 Claude Desktop 的 Code 分頁換上一片古希臘的夜空：深藍的天、亮金的點綴、大理石白的文字。星星慢慢閃，銀河斜斜劃過，右上方不時落下一場安靜的流星雨；右下角的岩石台地上，衛城的城牆由下往上打著暖光，山腳是一片小小的城市燈火。切到淺色模式，就變成淡藍的白天，雲慢慢飄，衛城換成大理石白。

A theme mod for the Claude Desktop Code tab: a night sky over an ancient Greek acropolis, with slow twinkling stars, the milky way and a gentle meteor shower; by day, a pale blue sky with soft clouds. Colors for both light and dark mode, and a moving vector backdrop.

這是社群作品，與 Anthropic 無關。This is a community project, not affiliated with Anthropic.

## 安裝 Install

在終端機的 Claude Code 提示列輸入 (at the prompt of a Claude Code terminal session):

```
/plugin install starry-acropolis-theme --marketplace guinea19820623-star/starry-acropolis-theme
```

出現 `Add marketplace?` 時按 `y`，再選安裝範圍（user scope 會套用到之後的每個對話）。Answer `y` to add the marketplace, then pick a scope (user scope applies to every session after).

從一般的命令列 (from a shell):

```
claude plugin install starry-acropolis-theme --marketplace guinea19820623-star/starry-acropolis-theme
```

在 Claude Desktop 裡 (in the desktop app, where `/plugin` does not run): 點提示框旁的 **+** → **Plugins** → **Add marketplace**，輸入 `guinea19820623-star/starry-acropolis-theme`，再按 **Add plugin**。

## 你會看到 What you get

- **深色 Dark**：夜空藍的底、暖白的字、亮金的強調色（例如程式碼的關鍵字）；紅、綠、琥珀仍保留原本的意思，只往這個色調靠。星星分五組錯開閃爍，七顆四芒亮星，十顆流星從右上方的輻射點往外放射，平均約三秒一顆。
- **淺色 Light**：暖米白的底、深藍灰的字、金色強調；淡藍天空、幾團柔雲、右下角的晨光。
- **衛城 Acropolis**：釘在畫面右下角，避開中間的文字和下方的輸入框，視窗寬窄都會跟著縮放。
- **減少動態 Reduced motion**：系統開了減少動態時，畫面停成完整的靜態畫，流星會藏起來。

## 小提醒 Notes

- 同一個對話一次只會有一個主題；裝了別的主題外掛，後套用的會蓋掉前一個。Only one theme stands per session; the last one set wins.
- Desktop 右側開著瀏覽器或終端機面板時，app 會暫停背景場景，只留主題底色；把面板關掉或獨立開出去，星空就會回來。While the browser or terminal pane is docked, the app pauses the backdrop.
- 終端機版和編輯器不畫主題。The terminal and editors draw no theme.

## 自己改 Make it yours

背景是程式產生的純向量 SVG（約 4 萬字元，不含圖片和字型）。改 `tools/gen-scene.mjs` 之後，在外掛資料夾執行：

```
node tools/gen-scene.mjs hooks/scene.js
```

它會重寫 `hooks/scene.js`，也會產生 `tools/scene.preview.svg`，用瀏覽器打開就能預覽（深淺色跟著系統模式）。配色在 `hooks/register.tsx`，由 `makeColors` 產生。

The backdrop is a generated pure-vector SVG. Edit `tools/gen-scene.mjs`, run the command above, and open `tools/scene.preview.svg` in a browser to preview it. Colors live in `hooks/register.tsx`.

## 授權 License

MIT，見 [LICENSE](LICENSE)。`hooks/make-colors.js` 與 `hooks/make-colors.d.ts` 是從 Claude Code 的 plugin-authoring 技能原樣複製的，不在 MIT 範圍內。
