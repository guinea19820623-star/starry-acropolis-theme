# Claude Desktop 星空外觀 · Starry Theme

<img src="docs/night.svg" alt="夜晚：月亮、星空、流星雨與山丘上點亮的古希臘衛城" width="720">

替 Claude Desktop 的 Code 分頁開一扇窗，窗外是古希臘的衛城。天色跟著你所在地的真實太陽走：黎明時地平線泛起紫粉色，太陽從東邊的山後升起，大理石被晨光染金；白天是淡藍的天和慢慢飄的雲；黃昏時太陽落到衛城後面，神廟先被夕照染成金色，再暗成剪影；入夜後銀河浮現，流星雨從右上方落下，城牆和山腳的燈火一盞盞亮起。月亮照著真實的位置和月相升落，遇到月食會被地球的影子咬缺、全食時變成紅銅色；當地下雪時，背景也會飄雪。介面在日出時切成淺色、日落時切成深色。

A window onto an ancient Greek acropolis for the Claude Desktop Code tab. The sky follows the real sun where you are: dawn, a pale blue day, a golden dusk, and a starry night with the milky way and a gentle meteor shower. The moon rises and sets in its real place and phase, darkens and turns copper in a lunar eclipse, and snow falls when it is snowing where you are. The app switches to light mode at sunrise and dark mode at sunset.

| 清晨 Dawn | 白天 Day | 黃昏 Dusk |
| --- | --- | --- |
| <img src="docs/dawn.svg" width="260" alt="清晨"> | <img src="docs/day.svg" width="260" alt="白天"> | <img src="docs/dusk.svg" width="260" alt="黃昏"> |
| **夜晚 Night** | **月全食 Lunar eclipse**（2026-03-03） | **下雪 Snow** |
| <img src="docs/night.svg" width="260" alt="夜晚"> | <img src="docs/eclipse.svg" width="260" alt="月全食"> | <img src="docs/snow.svg" width="260" alt="下雪"> |

這是社群作品，與 Anthropic 無關。This is a community project, not affiliated with Anthropic.

## 安裝 Install

在終端機的 Claude Code 提示列輸入 (at the prompt of a Claude Code terminal session):

```
/plugin install starry-acropolis-theme --marketplace guinea19820623-star/starry-acropolis-theme
```

出現 `Add marketplace?` 時按 `y`，再選安裝範圍（user scope 會套用到之後的每個對話）。Answer `y` to add the marketplace, then pick a scope (user scope applies to every session after).

從一般的命令列，順便設定你所在的位置 (from a shell, setting where you are):

```
claude plugin install starry-acropolis-theme --marketplace guinea19820623-star/starry-acropolis-theme --config latitude=25.03 --config longitude=121.56
```

在 Claude Desktop 裡 (in the desktop app, where `/plugin` does not run): 點提示框旁的 **+** → **Plugins** → **Add marketplace**，輸入 `guinea19820623-star/starry-acropolis-theme`，再按 **Add plugin**。

已經裝過舊版的話，更新後重新開啟 Claude Desktop (to update an earlier install, then restart the app):

```
claude plugin marketplace update starry-acropolis-theme
claude plugin update starry-acropolis-theme@starry-acropolis-theme
```

## 你所在的位置 Your location

日出日落和月亮依照經緯度計算，預設是台灣桃園（北緯 24.99、東經 121.3）。最簡單的做法：直接跟你的 Claude 說「把 starry-acropolis-theme 的經緯度設成我所在的城市」，它會幫你查好座標，執行下面這行（以東京為例）：

The sun and moon follow your latitude and longitude (default: Taoyuan, Taiwan). The easy way: ask your Claude to "set starry-acropolis-theme's latitude and longitude to my city"; it looks the place up and runs this (Tokyo as the example):

```
echo '{"latitude":"35.68","longitude":"139.69"}' | claude plugin configure starry-acropolis-theme@starry-acropolis-theme --values-stdin
```

北緯、東經為正，南緯、西經為負。不帶 `--values-stdin` 執行 `claude plugin configure starry-acropolis-theme@starry-acropolis-theme` 會列出目前的設定。改完重新開啟對話就會套用。North and east are positive. Run the command without `--values-stdin` to see the current values; new sessions pick them up.

## 天氣 Weather

`weather` 選項決定要不要飄雪 (the `weather` option):

- `auto`（預設）：每 30 分鐘向 [Open-Meteo](https://open-meteo.com/) 查一次當地天氣，回報下雪時才飄雪。這會把你設定的經緯度送到 open-meteo.com。Every 30 minutes asks Open-Meteo for the weather at your latitude and longitude (which it sends there) and snows when it reports snow.
- `off`：不查天氣、不連網。No weather, no network.
- `snow`：一直下雪，適合想看雪的人。Always snowing.

```
echo '{"weather":"snow"}' | claude plugin configure starry-acropolis-theme@starry-acropolis-theme --values-stdin
```

## 怎麼運作 How it works

- 外掛用天文公式算出太陽和月亮的高度、方位與月相（月亮用 Meeus《Astronomical Algorithms》的主要項，誤差約零點幾度）。月食依月亮進入地球本影的深度判斷：2026-03-03 的月全食算出本影食分 1.14（實際 1.15），2026-08-28 的月偏食算出 0.94（實際 0.93）。The sun and moon come from standard astronomical series (Meeus' main lunar terms); the eclipse check gives 1.14 for the total lunar eclipse of 2026-03-03 (actual 1.15).
- 接下來 24 小時的天色、太陽和月亮的路徑排成一段動畫，從現在開始播，所以轉換是連續的；每 15 分鐘重畫一次，電腦睡眠醒來後也會對回正確的時間。The next 24 hours are laid out as one CSS animation that starts now, redrawn every 15 minutes to stay on time.
- 每分鐘看一次太陽，日出切淺色、日落切深色。這會蓋過你在設定裡選的外觀模式。Once a minute it checks the sun and sets light mode from sunrise to sunset; this overrides the appearance you chose in settings.
- 不呼叫模型，也不會在對話裡加任何東西，所以不花 token。It never calls the model and adds nothing to the conversation, so it uses no tokens.
- 系統開了減少動態時，畫面停在「現在」的天空，流星藏起來，雪花停成靜止的雪景。With reduced motion on, the scene rests at the current sky.

## 小提醒 Notes

- 同一個對話一次只會有一個主題；裝了別的主題外掛，後套用的會蓋掉前一個。Only one theme stands per session; the last one set wins.
- Desktop 右側開著瀏覽器或終端機面板時，app 會暫停背景場景，只留主題底色；把面板關掉或獨立開出去，天空就會回來。While the browser or terminal pane is docked, the app pauses the backdrop.
- 終端機版和編輯器不畫主題。The terminal and editors draw no theme.

## 自己改 Make it yours

- 天文計算：`hooks/astro.js`。Astronomy: `hooks/astro.js`.
- 天色、太陽、月亮、夕照和燈光：`hooks/sky.js`，依太陽高度設定的顏色都在 `SKY` 和 `CHANNELS` 裡。Sky colours by sun altitude live in `hooks/sky.js`.
- 星星、流星、雲、雪和衛城的圖形：改 `tools/gen-scene.mjs`，再執行 `node tools/gen-scene.mjs hooks/parts.js`。The fixed drawing is generated by `tools/gen-scene.mjs`.
- 預覽：`node tools/preview.mjs tools/preview`，再用瀏覽器打開 `tools/preview/index.html`，會看到今天各時刻、幾種月相、月全食和下雪。Preview with `tools/preview.mjs`.
- 介面配色：`hooks/register.tsx`，由 `makeColors` 產生，深淺兩套。Interface colours are in `hooks/register.tsx`.

## 授權 License

MIT，見 [LICENSE](LICENSE)。`hooks/make-colors.js` 與 `hooks/make-colors.d.ts` 是從 Claude Code 的 plugin-authoring 技能原樣複製的，不在 MIT 範圍內。
